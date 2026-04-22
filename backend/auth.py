import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import get_db
from location_guard import is_thane_address, is_thane_pincode, is_within_thane_coordinates

auth_bp = Blueprint("auth", __name__)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    address = data.get("address", "").strip()
    pincode = data.get("pincode", "").strip()
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if not name or not email or not password or not address or not pincode or latitude is None or longitude is None:
        return jsonify({"error": "Name, email, password, address, pincode, latitude and longitude are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if not is_thane_address(address):
        return jsonify({"error": "Registration is allowed only for Thane residents"}), 403
    if not is_thane_pincode(pincode):
        return jsonify({"error": "Only Thane pincodes are allowed for registration"}), 403
    try:
        lat = float(latitude)
        lng = float(longitude)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid latitude/longitude values"}), 400
    if not is_within_thane_coordinates(lat, lng):
        return jsonify({"error": "Registration is allowed only for users located in Thane"}), 403

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "Email already registered"}), 409
            hashed = hash_password(password)
            cursor.execute(
                """INSERT INTO users (name, email, password, role, address, pincode, latitude, longitude)
                   VALUES (%s, %s, %s, 'citizen', %s, %s, %s, %s)""",
                (name, email, hashed, address, pincode, lat, lng),
            )
            db.commit()
            return jsonify({"message": "Registration successful"}), 201
    finally:
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user or not verify_password(password, user["password"]):
                return jsonify({"error": "Invalid credentials"}), 401

            identity = str(user["id"])
            token = create_access_token(identity=identity)
            role_value = str(user["role"]).lower() if user.get("role") is not None else "citizen"
            return jsonify(
                {
                    "token": token,
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"],
                        "role": role_value,
                    },
                }
            ), 200
    finally:
        db.close()


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, email, role, created_at FROM users WHERE id = %s",
                (user_id,),
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404
            if user.get("created_at"):
                user["created_at"] = user["created_at"].isoformat()
            return jsonify(user), 200
    finally:
        db.close()
