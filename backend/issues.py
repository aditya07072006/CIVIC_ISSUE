import os
import uuid
import math
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from database import get_db
from config import Config

issues_bp = Blueprint("issues", __name__)

ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS


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
            return cursor.fetchone()
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

    if not all([title, description, category, severity]):
        return jsonify({"error": "title, description, category, severity are required"}), 400

    # Duplicate detection within 30m radius
    if latitude and longitude:
        lat, lon = float(latitude), float(longitude)
        db = get_db()
        try:
            with db.cursor() as cursor:
                cursor.execute(
                    "SELECT id, latitude, longitude FROM issues WHERE category = %s AND status != 'resolved'",
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
            cursor.execute(
                """INSERT INTO issues (title, description, category, severity, latitude, longitude,
                   image, status, priority, sla_hours, user_id)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s, %s, %s)""",
                (title, description, category, severity,
                 latitude or None, longitude or None,
                 image_filename, priority, sla_hours, user_id),
            )
            issue_id = cursor.lastrowid
            add_timeline(db, issue_id, "Issue reported by citizen", user_id)
            db.commit()
            return jsonify({"message": "Issue reported successfully", "id": issue_id}), 201
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
                       WHERE 1=1"""
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
            cursor.execute("SELECT image FROM issues WHERE id = %s", (issue_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "Issue not found"}), 404
            if row["image"]:
                img_path = os.path.join(Config.UPLOAD_FOLDER, row["image"])
                if os.path.exists(img_path):
                    os.remove(img_path)
            cursor.execute("DELETE FROM issues WHERE id = %s", (issue_id,))
            db.commit()
            return jsonify({"message": "Issue deleted"}), 200
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
