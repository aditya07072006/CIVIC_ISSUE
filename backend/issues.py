import os
import uuid
import math
import io
import textwrap
import urllib.request
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from database import get_db
from config import Config
from location_guard import is_thane_address, is_within_thane_coordinates

issues_bp = Blueprint("issues", __name__)

ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS
IST_TZ = timezone(timedelta(hours=5, minutes=30))

CATEGORY_TO_SUBDEPT = {
    "pothole": "Pothole",
    "garbage": "Garbage Overflow",
    "water_leakage": "Water Leakage",
    "streetlight": "Streetlight",
    "road_damage": "Road Damage",
    "drainage": "Drainage",
    "other": "Other",
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def serialize_issue(issue):
    for field in ["created_at", "updated_at"]:
        if issue.get(field) and hasattr(issue[field], "isoformat"):
            issue[field] = issue[field].isoformat()
    return issue


def get_user(user_id):
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id, role FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if row and row.get("role") is not None:
                row["role"] = str(row["role"]).lower()
            return row
    finally:
        db.close()


def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def add_timeline(db, issue_id, action, performed_by):
    with db.cursor() as cursor:
        cursor.execute(
            "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
            (issue_id, action, performed_by),
        )


def generate_issue_token():
    return f"THN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def _draw_wrapped_text(pdf, text, x, y, max_chars=95, line_height=14):
    if not text:
        return y
    lines = textwrap.wrap(str(text), width=max_chars)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= line_height
    return y


def _format_timestamp(value):
    if not value:
        return "N/A"
    if hasattr(value, "strftime"):
        if getattr(value, "tzinfo", None) is None:
            # MySQL timestamps are typically naive here; treat them as IST for display.
            return f"{value.strftime('%Y-%m-%d %H:%M:%S')} IST"
        return value.astimezone(IST_TZ).strftime("%Y-%m-%d %H:%M:%S IST")
    return str(value)


@issues_bp.route("", methods=["POST"])
@jwt_required()
def create_issue():
    user_id = get_jwt_identity()

    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    category = request.form.get("category", "").strip()
    severity = request.form.get("severity", "").strip()
    latitude = request.form.get("latitude")
    longitude = request.form.get("longitude")
    address = request.form.get("address", "").strip()

    if not all([title, description, category, severity]):
        return jsonify({"error": "title, description, category, severity are required"}), 400

    if not latitude or not longitude:
        return jsonify({"error": "Location coordinates are required. Only Thane issues are allowed"}), 400

    try:
        lat = float(latitude)
        lon = float(longitude)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid latitude/longitude values"}), 400

    if not is_within_thane_coordinates(lat, lon):
        return jsonify({"error": "Only issues within Thane are allowed"}), 403

    if not address:
        return jsonify({"error": "Issue address is required and must be in Thane"}), 400

    if not is_thane_address(address):
        return jsonify({"error": "Issue address must be in Thane"}), 403

    # Duplicate detection within 30m radius
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT id, latitude, longitude FROM issues WHERE category = %s AND status != 'resolved' AND deleted_at IS NULL",
                (category,),
            )
            existing = cursor.fetchall()
            for ex in existing:
                if ex["latitude"] and ex["longitude"]:
                    dist = haversine(lat, lon, float(ex["latitude"]), float(ex["longitude"]))
                    if dist <= 30:
                        return jsonify({
                            "error": "duplicate",
                            "message": f"A similar issue already exists within 30m (Issue #{ex['id']}). Please check existing reports.",
                            "existing_id": ex["id"],
                        }), 409
    finally:
        db.close()

    image_filename = None
    if "image" in request.files:
        file = request.files["image"]
        if file and file.filename and allowed_file(file.filename):
            if Config.USE_CLOUDINARY:
                import cloudinary.uploader
                result = cloudinary.uploader.upload(file, folder="civic_issues")
                image_filename = result["secure_url"]
            else:
                ext = file.filename.rsplit(".", 1)[1].lower()
                image_filename = f"{uuid.uuid4().hex}.{ext}"
                file.save(os.path.join(Config.UPLOAD_FOLDER, image_filename))

    priority = Config.PRIORITY_MAP.get(severity, "normal")
    sla_hours = Config.SLA_HOURS.get(category, 48)

    db = get_db()
    try:
        with db.cursor() as cursor:
            sub_dept_name = CATEGORY_TO_SUBDEPT.get(category)
            department_id = None
            sub_department_id = None
            if sub_dept_name:
                cursor.execute(
                    """SELECT d.id AS department_id, sd.id AS sub_department_id
                       FROM sub_departments sd
                       JOIN departments d ON d.id = sd.department_id
                       WHERE sd.name = %s
                       LIMIT 1""",
                    (sub_dept_name,),
                )
                mapping = cursor.fetchone()
                if mapping:
                    department_id = mapping["department_id"]
                    sub_department_id = mapping["sub_department_id"]

            issue_token = None
            inserted = False
            for _ in range(3):
                issue_token = generate_issue_token()
                try:
                    cursor.execute(
                        """INSERT INTO issues (title, description, category, severity, latitude, longitude,
                           image, address, issue_token, status, priority, sla_hours, user_id, department_id, sub_department_id)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s, %s, %s, %s, %s)""",
                        (title, description, category, severity,
                         latitude or None, longitude or None,
                         image_filename, address or None, issue_token, priority, sla_hours, user_id,
                         department_id, sub_department_id),
                    )
                    inserted = True
                    break
                except Exception as exc:
                    if "uniq_issue_token" not in str(exc):
                        raise
            if not inserted:
                return jsonify({"error": "Could not generate issue token. Please try again"}), 500
            issue_id = cursor.lastrowid
            add_timeline(db, issue_id, "Issue reported by citizen", user_id)
            db.commit()
            return jsonify({
                "message": "Issue reported successfully",
                "id": issue_id,
                "issue_token": issue_token,
            }), 201
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>/receipt", methods=["GET"])
@jwt_required()
def download_issue_receipt(issue_id):
    user_id = get_jwt_identity()
    user = get_user(user_id)

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT i.*, u.name AS reporter_name, u.email AS reporter_email
                   FROM issues i
                   JOIN users u ON i.user_id = u.id
                   WHERE i.id = %s AND i.deleted_at IS NULL""",
                (issue_id,),
            )
            issue = cursor.fetchone()
            if not issue:
                return jsonify({"error": "Issue not found"}), 404

            if user["role"] != "admin" and str(issue["user_id"]) != str(user_id):
                return jsonify({"error": "Access denied"}), 403

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        page_w, page_h = A4
        left = 40
        y = page_h - 45

        pdf.setTitle(f"Issue_Receipt_{issue.get('issue_token') or issue_id}")
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(left, y, "Civic Issue Receipt")
        y -= 24

        pdf.setFont("Helvetica", 10)
        generated_at = datetime.now(timezone.utc).astimezone(IST_TZ).strftime("%Y-%m-%d %H:%M:%S IST")
        issue_created_at = _format_timestamp(issue.get("created_at"))
        y = _draw_wrapped_text(pdf, f"Issue Reported At: {issue_created_at}", left, y)
        y = _draw_wrapped_text(pdf, f"Receipt Generated At: {generated_at}", left, y)
        y = _draw_wrapped_text(pdf, f"Issue ID: {issue['id']}", left, y)
        y = _draw_wrapped_text(pdf, f"Token No: {issue.get('issue_token') or 'N/A'}", left, y)
        y = _draw_wrapped_text(pdf, f"Reporter: {issue.get('reporter_name')} ({issue.get('reporter_email')})", left, y)
        y -= 6

        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(left, y, "Issue Details")
        y -= 16
        pdf.setFont("Helvetica", 10)

        y = _draw_wrapped_text(pdf, f"Title: {issue.get('title') or ''}", left, y)
        y = _draw_wrapped_text(pdf, f"Description: {issue.get('description') or ''}", left, y)
        y = _draw_wrapped_text(pdf, f"Address: {issue.get('address') or ''}", left, y)
        y = _draw_wrapped_text(pdf, f"Category: {issue.get('category') or ''}", left, y)
        y = _draw_wrapped_text(pdf, f"Severity: {issue.get('severity') or ''}", left, y)
        y = _draw_wrapped_text(pdf, f"Status: {issue.get('status') or ''}", left, y)
        y = _draw_wrapped_text(pdf, f"Coordinates: {issue.get('latitude') or ''}, {issue.get('longitude') or ''}", left, y)

        image_value = issue.get("image")
        if image_value and y > 180:
            y -= 8
            pdf.setFont("Helvetica-Bold", 11)
            pdf.drawString(left, y, "Issue Photo")
            y -= 12
            pdf.setFont("Helvetica", 9)

            img_reader = None
            try:
                if isinstance(image_value, str) and image_value.startswith("http"):
                    with urllib.request.urlopen(image_value, timeout=10) as response:
                        img_reader = ImageReader(io.BytesIO(response.read()))
                else:
                    image_path = os.path.join(Config.UPLOAD_FOLDER, str(image_value))
                    if os.path.exists(image_path):
                        img_reader = ImageReader(image_path)

                if img_reader:
                    pdf.drawImage(img_reader, left, max(60, y - 220), width=260, height=180, preserveAspectRatio=True, mask='auto')
                else:
                    pdf.drawString(left, y, f"Image reference: {image_value}")
            except Exception:
                pdf.drawString(left, y, f"Image reference: {image_value}")

        pdf.showPage()
        pdf.save()
        buffer.seek(0)

        token_part = issue.get("issue_token") or f"ISSUE-{issue_id}"
        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"issue-receipt-{token_part}.pdf",
        )
    finally:
        db.close()


@issues_bp.route("", methods=["GET"])
@jwt_required()
def get_issues():
    user_id = get_jwt_identity()
    user = get_user(user_id)

    category = request.args.get("category")
    severity = request.args.get("severity")
    status = request.args.get("status")
    search = request.args.get("search")
    overdue = request.args.get("overdue") == "true"
    sort_by = request.args.get("sort_by", "created_at")
    order = request.args.get("order", "desc")

    allowed_sort = {"created_at", "severity", "priority", "status", "updated_at"}
    if sort_by not in allowed_sort:
        sort_by = "created_at"
    order = "asc" if order == "asc" else "desc"

    db = get_db()
    try:
        with db.cursor() as cursor:
            query = """SELECT i.*, u.name as reporter_name, u.email as reporter_email,
                       COUNT(DISTINCT up.user_id) as upvote_count,
                       MAX(CASE WHEN up.user_id = %s THEN 1 ELSE 0 END) as user_upvoted
                       FROM issues i
                       JOIN users u ON i.user_id = u.id
                       LEFT JOIN issue_upvotes up ON i.id = up.issue_id
                       WHERE i.deleted_at IS NULL"""
            params = [user_id]

            if user["role"] == "citizen":
                query += " AND i.user_id = %s"
                params.append(user_id)

            if category:
                query += " AND i.category = %s"
                params.append(category)
            if severity:
                query += " AND i.severity = %s"
                params.append(severity)
            if status:
                query += " AND i.status = %s"
                params.append(status)
            if overdue:
                query += " AND i.status NOT IN ('resolved','rejected') AND TIMESTAMPDIFF(HOUR, i.created_at, NOW()) > i.sla_hours"
            if search:
                query += " AND (i.title LIKE %s OR i.description LIKE %s)"
                params.extend([f"%{search}%", f"%{search}%"])

            query += f" GROUP BY i.id ORDER BY i.{sort_by} {order}"
            cursor.execute(query, params)
            issues = [serialize_issue(i) for i in cursor.fetchall()]
            return jsonify(issues), 200
    finally:
        db.close()


@issues_bp.route("/public/list", methods=["GET"])
@jwt_required()
def get_public_issues():
    status = request.args.get("status")
    category = request.args.get("category")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "newest")

    db = get_db()
    try:
        with db.cursor() as cursor:
            query = """SELECT
                         i.id,
                         i.title,
                         i.description,
                         i.category,
                         i.severity,
                         i.status,
                         i.address,
                         i.latitude,
                         i.longitude,
                         i.image,
                         i.created_at,
                         i.updated_at,
                         u.name AS reporter_name,
                         COUNT(DISTINCT up.user_id) AS upvote_count,
                         AVG(f.rating) AS avg_rating,
                         COUNT(f.id) AS feedback_count
                       FROM issues i
                       JOIN users u ON i.user_id = u.id
                       LEFT JOIN issue_upvotes up ON up.issue_id = i.id
                       LEFT JOIN issue_feedback f ON f.issue_id = i.id
                       WHERE i.deleted_at IS NULL"""
            params = []

            if status == "resolved":
                query += " AND i.status = 'resolved'"
            elif status == "unresolved":
                query += " AND i.status IN ('pending', 'in_progress', 'rejected')"
            elif status in {"pending", "in_progress", "resolved", "rejected"}:
                query += " AND i.status = %s"
                params.append(status)

            if category:
                query += " AND i.category = %s"
                params.append(category)

            if search:
                query += " AND (i.title LIKE %s OR i.description LIKE %s OR i.address LIKE %s)"
                like = f"%{search}%"
                params.extend([like, like, like])

            query += " GROUP BY i.id"

            if sort_by == "oldest":
                query += " ORDER BY i.created_at ASC"
            elif sort_by == "rating_high":
                query += " ORDER BY (avg_rating IS NULL) ASC, avg_rating DESC, feedback_count DESC, i.created_at DESC"
            elif sort_by == "rating_low":
                query += " ORDER BY (avg_rating IS NULL) ASC, avg_rating ASC, feedback_count DESC, i.created_at DESC"
            elif sort_by == "most_upvoted":
                query += " ORDER BY upvote_count DESC, i.created_at DESC"
            else:
                query += " ORDER BY i.created_at DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            for row in rows:
                for dt_key in ["created_at", "updated_at"]:
                    if row.get(dt_key) and hasattr(row[dt_key], "isoformat"):
                        row[dt_key] = row[dt_key].isoformat()
                row["avg_rating"] = float(row["avg_rating"]) if row.get("avg_rating") is not None else None

            return jsonify(rows), 200
    finally:
        db.close()


@issues_bp.route("/public/stats", methods=["GET"])
@jwt_required()
def get_public_stats():
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM issues WHERE deleted_at IS NULL")
            total = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) AS resolved FROM issues WHERE deleted_at IS NULL AND status = 'resolved'")
            resolved = cursor.fetchone()["resolved"]

            cursor.execute("""
                SELECT COUNT(*) AS unresolved
                FROM issues
                WHERE deleted_at IS NULL AND status IN ('pending', 'in_progress', 'rejected')
            """)
            unresolved = cursor.fetchone()["unresolved"]

            cursor.execute(
                "SELECT category, COUNT(*) AS count FROM issues WHERE deleted_at IS NULL GROUP BY category ORDER BY count DESC"
            )
            by_category = {r["category"]: r["count"] for r in cursor.fetchall()}

            cursor.execute(
                "SELECT severity, COUNT(*) AS count FROM issues WHERE deleted_at IS NULL GROUP BY severity"
            )
            by_severity = {r["severity"]: r["count"] for r in cursor.fetchall()}

            cursor.execute(
                "SELECT status, COUNT(*) AS count FROM issues WHERE deleted_at IS NULL GROUP BY status"
            )
            by_status = {r["status"]: r["count"] for r in cursor.fetchall()}

            cursor.execute("SELECT AVG(rating) AS avg_rating FROM issue_feedback WHERE rating IS NOT NULL")
            avg_rating = cursor.fetchone()["avg_rating"]

            return jsonify(
                {
                    "total": total,
                    "resolved": resolved,
                    "unresolved": unresolved,
                    "resolution_rate": round((resolved / total) * 100, 1) if total else 0,
                    "avg_rating": round(float(avg_rating), 2) if avg_rating is not None else 0,
                    "by_category": by_category,
                    "by_severity": by_severity,
                    "by_status": by_status,
                }
            ), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>", methods=["GET"])
@jwt_required()
def get_issue(issue_id):
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT i.*, u.name as reporter_name, u.email as reporter_email
                   FROM issues i JOIN users u ON i.user_id = u.id
                   WHERE i.id = %s""",
                (issue_id,),
            )
            issue = cursor.fetchone()
            if not issue:
                return jsonify({"error": "Issue not found"}), 404

            cursor.execute(
                """SELECT it.*, u.name as actor_name
                   FROM issue_timeline it
                   LEFT JOIN users u ON it.performed_by = u.id
                   WHERE it.issue_id = %s ORDER BY it.created_at ASC""",
                (issue_id,),
            )
            timeline = cursor.fetchall()
            for t in timeline:
                if t.get("created_at"):
                    t["created_at"] = t["created_at"].isoformat()

            issue = serialize_issue(issue)
            issue["timeline"] = timeline
            return jsonify(issue), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(issue_id):
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    new_status = data.get("status")
    valid_statuses = {"pending", "in_progress", "resolved", "rejected"}
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM issues WHERE id = %s", (issue_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Issue not found"}), 404
            cursor.execute("UPDATE issues SET status = %s WHERE id = %s", (new_status, issue_id))
            action_map = {
                "pending": "Issue moved back to Pending",
                "in_progress": "Issue marked as In Progress by admin",
                "resolved": "Issue resolved by admin",
                "rejected": "Issue rejected by admin",
            }
            add_timeline(db, issue_id, action_map[new_status], user_id)
            db.commit()
            return jsonify({"message": "Status updated"}), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>", methods=["DELETE"])
@jwt_required()
def delete_issue(issue_id):
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM issues WHERE id = %s", (issue_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "Issue not found"}), 404
            cursor.execute(
                "UPDATE issues SET deleted_at = NOW() WHERE id = %s",
                (issue_id,)
            )
            db.commit()
            return jsonify({"message": "Issue deleted"}), 200
    finally:
        db.close()


@issues_bp.route("/deleted/list", methods=["GET"])
@jwt_required()
def get_deleted_issues():
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    category = request.args.get("category")
    severity = request.args.get("severity")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "deleted_at")
    order = request.args.get("order", "desc")

    allowed_sort = {"created_at", "severity", "deleted_at", "title"}
    if sort_by not in allowed_sort:
        sort_by = "deleted_at"
    order = "asc" if order == "asc" else "desc"

    db = get_db()
    try:
        with db.cursor() as cursor:
            query = """SELECT i.*, u.name as reporter_name
                       FROM issues i
                       LEFT JOIN users u ON i.user_id = u.id
                       WHERE i.deleted_at IS NOT NULL"""

            params = []
            if category:
                query += " AND i.category = %s"
                params.append(category)
            if severity:
                query += " AND i.severity = %s"
                params.append(severity)
            if search:
                query += " AND (i.title LIKE %s OR i.description LIKE %s)"
                search_param = f"%{search}%"
                params.extend([search_param, search_param])

            query += f" ORDER BY i.{sort_by} {order}"
            cursor.execute(query, params)
            issues = cursor.fetchall()
            return jsonify([serialize_issue(i) for i in issues]), 200
    finally:
        db.close()


@issues_bp.route("/analytics/stats", methods=["GET"])
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM issues")
            total = cursor.fetchone()["total"]

            cursor.execute("SELECT status, COUNT(*) as count FROM issues GROUP BY status")
            by_status = {row["status"]: row["count"] for row in cursor.fetchall()}

            cursor.execute("SELECT category, COUNT(*) as count FROM issues GROUP BY category")
            by_category = {row["category"]: row["count"] for row in cursor.fetchall()}

            cursor.execute("SELECT severity, COUNT(*) as count FROM issues GROUP BY severity")
            by_severity = {row["severity"]: row["count"] for row in cursor.fetchall()}

            # Overdue issues
            cursor.execute("""
                SELECT COUNT(*) as overdue FROM issues
                WHERE status NOT IN ('resolved','rejected')
                AND TIMESTAMPDIFF(HOUR, created_at, NOW()) > sla_hours
            """)
            overdue = cursor.fetchone()["overdue"]

            return jsonify({
                "total": total,
                "by_status": by_status,
                "by_category": by_category,
                "by_severity": by_severity,
                "overdue": overdue,
            }), 200
    finally:
        db.close()


@issues_bp.route("/map/all", methods=["GET"])
@jwt_required()
def get_map_issues():
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT id, title, category, severity, status, latitude, longitude, image
                   FROM issues WHERE latitude IS NOT NULL AND longitude IS NOT NULL"""
            )
            issues = cursor.fetchall()
            return jsonify(issues), 200
    finally:
        db.close()


@issues_bp.route("/analytics/trend", methods=["GET"])
@jwt_required()
def get_trend():
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    from datetime import date, timedelta
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT DATE(created_at) as day, COUNT(*) as count
                FROM issues
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            """)
            rows = cursor.fetchall()
            date_map = {str(row["day"]): row["count"] for row in rows}
            today = date.today()
            result = [
                {"date": str(today - timedelta(days=i)), "count": date_map.get(str(today - timedelta(days=i)), 0)}
                for i in range(29, -1, -1)
            ]
            return jsonify(result), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>/upvote", methods=["POST"])
@jwt_required()
def add_upvote(issue_id):
    user_id = get_jwt_identity()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM issues WHERE id = %s", (issue_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Issue not found"}), 404
            try:
                cursor.execute(
                    "INSERT INTO issue_upvotes (issue_id, user_id) VALUES (%s, %s)",
                    (issue_id, user_id),
                )
                db.commit()
            except Exception:
                pass  # already upvoted — ignore duplicate
            cursor.execute("SELECT COUNT(*) as cnt FROM issue_upvotes WHERE issue_id = %s", (issue_id,))
            count = cursor.fetchone()["cnt"]
            return jsonify({"upvote_count": count, "user_upvoted": True}), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>/upvote", methods=["DELETE"])
@jwt_required()
def remove_upvote(issue_id):
    user_id = get_jwt_identity()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "DELETE FROM issue_upvotes WHERE issue_id = %s AND user_id = %s",
                (issue_id, user_id),
            )
            db.commit()
            cursor.execute("SELECT COUNT(*) as cnt FROM issue_upvotes WHERE issue_id = %s", (issue_id,))
            count = cursor.fetchone()["cnt"]
            return jsonify({"upvote_count": count, "user_upvoted": False}), 200
    finally:
        db.close()


@issues_bp.route("/feedback/my", methods=["GET"])
@jwt_required()
def get_my_feedback_items():
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "citizen":
        return jsonify({"error": "Citizen access required"}), 403

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT i.id, i.title, i.category, i.severity, i.status, i.updated_at,
                          f.id AS feedback_id, f.is_satisfied, f.rating, f.comment, f.created_at AS feedback_at
                   FROM issues i
                   LEFT JOIN issue_feedback f ON f.issue_id = i.id AND f.user_id = %s
                   WHERE i.user_id = %s
                     AND i.deleted_at IS NULL
                   ORDER BY i.updated_at DESC""",
                (user_id, user_id),
            )
            rows = cursor.fetchall()
            for row in rows:
                for dt_key in ["updated_at", "feedback_at"]:
                    if row.get(dt_key) and hasattr(row[dt_key], "isoformat"):
                        row[dt_key] = row[dt_key].isoformat()
            return jsonify(rows), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>/feedback", methods=["POST"])
@jwt_required()
def submit_feedback(issue_id):
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "citizen":
        return jsonify({"error": "Citizen access required"}), 403

    data = request.get_json() or {}
    is_satisfied = data.get("is_satisfied")
    rating = data.get("rating")
    comment = (data.get("comment") or "").strip()

    if not isinstance(is_satisfied, bool):
        return jsonify({"error": "is_satisfied must be true or false"}), 400
    if rating is not None:
        try:
            rating = int(rating)
        except Exception:
            return jsonify({"error": "rating must be an integer between 1 and 5"}), 400
        if rating < 1 or rating > 5:
            return jsonify({"error": "rating must be an integer between 1 and 5"}), 400
    if len(comment) > 1000:
        return jsonify({"error": "comment must be at most 1000 characters"}), 400

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT id, status FROM issues WHERE id = %s AND user_id = %s AND deleted_at IS NULL",
                (issue_id, user_id),
            )
            issue = cursor.fetchone()
            if not issue:
                return jsonify({"error": "Issue not found"}), 404
            if issue["status"] not in {"resolved", "rejected"}:
                return jsonify({"error": "Feedback can be submitted only for resolved/rejected issues"}), 400

            cursor.execute(
                """INSERT INTO issue_feedback (issue_id, user_id, is_satisfied, rating, comment)
                   VALUES (%s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                     is_satisfied = VALUES(is_satisfied),
                     rating = VALUES(rating),
                     comment = VALUES(comment),
                     created_at = CURRENT_TIMESTAMP""",
                (issue_id, user_id, is_satisfied, rating, comment or None),
            )
            feedback_note = "Citizen marked resolution as satisfactory" if is_satisfied else "Citizen marked resolution as unsatisfactory"
            add_timeline(db, issue_id, feedback_note, user_id)
            db.commit()
            return jsonify({"message": "Feedback submitted successfully"}), 200
    finally:
        db.close()


@issues_bp.route("/feedback/all", methods=["GET"])
@jwt_required()
def get_all_feedback():
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403

    search = (request.args.get("search") or "").strip()
    status = (request.args.get("status") or "").strip()
    is_satisfied = (request.args.get("is_satisfied") or "").strip().lower()

    db = get_db()
    try:
        with db.cursor() as cursor:
            query = """SELECT
                         f.id AS feedback_id,
                         f.issue_id,
                         f.user_id,
                         f.is_satisfied,
                         f.rating,
                         f.comment,
                         f.created_at AS feedback_at,
                         i.title AS issue_title,
                         i.category,
                         i.severity,
                         i.status,
                         i.updated_at AS issue_updated_at,
                         u.name AS citizen_name,
                         u.email AS citizen_email
                       FROM issue_feedback f
                       JOIN issues i ON i.id = f.issue_id
                       JOIN users u ON u.id = f.user_id
                       WHERE i.deleted_at IS NULL"""
            params = []

            if status:
                query += " AND i.status = %s"
                params.append(status)

            if is_satisfied in {"true", "false"}:
                query += " AND f.is_satisfied = %s"
                params.append(1 if is_satisfied == "true" else 0)

            if search:
                query += " AND (i.title LIKE %s OR u.name LIKE %s OR u.email LIKE %s OR f.comment LIKE %s)"
                like = f"%{search}%"
                params.extend([like, like, like, like])

            query += " ORDER BY f.created_at DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()

            for row in rows:
                for dt_key in ["feedback_at", "issue_updated_at"]:
                    if row.get(dt_key) and hasattr(row[dt_key], "isoformat"):
                        row[dt_key] = row[dt_key].isoformat()
                row["is_satisfied"] = bool(row.get("is_satisfied"))

            return jsonify(rows), 200
    finally:
        db.close()


# ========== DEPARTMENT ENDPOINTS ==========

@issues_bp.route("/departments/all", methods=["GET"])
@jwt_required()
def get_all_departments():
    """Get all departments with their sub-departments"""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM departments ORDER BY name ASC")
            departments = cursor.fetchall()
            
            for dept in departments:
                cursor.execute(
                    """
                    SELECT sd.id, sd.name, sd.description, COUNT(i.id) AS issue_count
                    FROM sub_departments sd
                    LEFT JOIN issues i ON i.sub_department_id = sd.id AND i.deleted_at IS NULL
                    WHERE sd.department_id = %s
                    GROUP BY sd.id, sd.name, sd.description
                    ORDER BY sd.name ASC
                    """,
                    (dept['id'],)
                )
                dept['sub_departments'] = cursor.fetchall()
            
            return jsonify(departments), 200
    finally:
        db.close()


@issues_bp.route("/department/<int:dept_id>/issues", methods=["GET"])
@jwt_required()
def get_department_issues(dept_id):
    """Get all issues for a specific department"""
    status_filter = request.args.get("status")
    severity = request.args.get("severity")
    search = request.args.get("search")
    
    db = get_db()
    try:
        with db.cursor() as cursor:
            # Get sub-department IDs for this department
            cursor.execute(
                "SELECT id FROM sub_departments WHERE department_id = %s",
                (dept_id,)
            )
            sub_dept_ids = [row['id'] for row in cursor.fetchall()]
            
            if not sub_dept_ids:
                return jsonify([]), 200
            
            placeholders = ','.join(['%s'] * len(sub_dept_ids))
            query = f"""
                SELECT i.*, u.name as reporter_name, u.email as reporter_email,
                       d.name as department_name, sd.name as sub_department_name,
                       COUNT(DISTINCT up.user_id) as upvote_count
                FROM issues i
                JOIN users u ON i.user_id = u.id
                LEFT JOIN departments d ON i.department_id = d.id
                LEFT JOIN sub_departments sd ON i.sub_department_id = sd.id
                LEFT JOIN issue_upvotes up ON i.id = up.issue_id
                WHERE i.sub_department_id IN ({placeholders})
                AND i.deleted_at IS NULL
            """
            
            params = sub_dept_ids
            
            if status_filter:
                query += " AND i.status = %s"
                params.append(status_filter)
            if severity:
                query += " AND i.severity = %s"
                params.append(severity)
            if search:
                query += " AND (i.title LIKE %s OR i.description LIKE %s)"
                search_param = f"%{search}%"
                params.extend([search_param, search_param])
            
            query += " GROUP BY i.id ORDER BY i.created_at DESC"
            cursor.execute(query, params)
            issues = [serialize_issue(i) for i in cursor.fetchall()]
            
            return jsonify(issues), 200
    finally:
        db.close()


@issues_bp.route("/sub_department/<int:sub_dept_id>/issues", methods=["GET"])
@jwt_required()
def get_sub_department_issues(sub_dept_id):
    """Get all issues for a specific sub-department"""
    status_filter = request.args.get("status")
    severity = request.args.get("severity")
    search = request.args.get("search")
    
    db = get_db()
    try:
        with db.cursor() as cursor:
            query = """
                SELECT i.*, u.name as reporter_name, u.email as reporter_email,
                       d.name as department_name, sd.name as sub_department_name,
                       COUNT(DISTINCT up.user_id) as upvote_count
                FROM issues i
                JOIN users u ON i.user_id = u.id
                LEFT JOIN departments d ON i.department_id = d.id
                LEFT JOIN sub_departments sd ON i.sub_department_id = sd.id
                LEFT JOIN issue_upvotes up ON i.id = up.issue_id
                WHERE i.sub_department_id = %s
                AND i.deleted_at IS NULL
            """
            
            params = [sub_dept_id]
            
            if status_filter:
                query += " AND i.status = %s"
                params.append(status_filter)
            if severity:
                query += " AND i.severity = %s"
                params.append(severity)
            if search:
                query += " AND (i.title LIKE %s OR i.description LIKE %s)"
                search_param = f"%{search}%"
                params.extend([search_param, search_param])
            
            query += " GROUP BY i.id ORDER BY i.created_at DESC"
            cursor.execute(query, params)
            issues = [serialize_issue(i) for i in cursor.fetchall()]
            
            return jsonify(issues), 200
    finally:
        db.close()


@issues_bp.route("/<int:issue_id>/assign_department", methods=["PATCH"])
@jwt_required()
def assign_department_to_issue(issue_id):
    """Assign an issue to a department and sub-department"""
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    data = request.get_json()
    department_id = data.get("department_id")
    sub_department_id = data.get("sub_department_id")
    
    if not department_id or not sub_department_id:
        return jsonify({"error": "department_id and sub_department_id are required"}), 400
    
    db = get_db()
    try:
        with db.cursor() as cursor:
            # Verify department and sub-department exist
            cursor.execute("SELECT id FROM departments WHERE id = %s", (department_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Department not found"}), 404
            
            cursor.execute(
                "SELECT id FROM sub_departments WHERE id = %s AND department_id = %s",
                (sub_department_id, department_id)
            )
            if not cursor.fetchone():
                return jsonify({"error": "Sub-department not found or doesn't belong to this department"}), 404
            
            # Verify issue exists
            cursor.execute("SELECT id FROM issues WHERE id = %s", (issue_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Issue not found"}), 404
            
            # Assign department and sub-department
            cursor.execute(
                """UPDATE issues 
                   SET department_id = %s, sub_department_id = %s 
                   WHERE id = %s""",
                (department_id, sub_department_id, issue_id)
            )
            
            add_timeline(db, issue_id, f"Issue assigned to department by admin", user_id)
            db.commit()
            
            return jsonify({"message": "Issue assigned to department successfully"}), 200
    finally:
        db.close()


@issues_bp.route("/department/stats", methods=["GET"])
@jwt_required()
def get_department_stats():
    """Get statistics for all departments"""
    user_id = get_jwt_identity()
    user = get_user(user_id)
    if user["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    d.id,
                    d.name,
                    COUNT(i.id) as total_issues,
                    SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN i.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN i.status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM departments d
                LEFT JOIN sub_departments sd ON d.id = sd.department_id
                LEFT JOIN issues i ON sd.id = i.sub_department_id
                GROUP BY d.id, d.name
                ORDER BY d.name ASC
            """)
            stats = cursor.fetchall()
            
            return jsonify(stats), 200
    finally:
        db.close()
