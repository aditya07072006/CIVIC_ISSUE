import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from auth import auth_bp
from issues import issues_bp

app = Flask(__name__)
app.config.from_object(Config)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
CORS(app, resources={r"/api/*": {"origins": [FRONTEND_URL, "http://localhost:5173"]}})
jwt = JWTManager(app)

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Init Cloudinary if configured
if Config.USE_CLOUDINARY:
    import cloudinary
    cloudinary.config(
        cloud_name=Config.CLOUDINARY_CLOUD_NAME,
        api_key=Config.CLOUDINARY_API_KEY,
        api_secret=Config.CLOUDINARY_API_SECRET,
    )

# Create upvotes table if it doesn't exist yet
def _ensure_upvotes_table():
    from database import get_db
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS issue_upvotes (
                    issue_id INT NOT NULL,
                    user_id  INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (issue_id, user_id),
                    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
                )
            """)
            db.commit()
    finally:
        db.close()


def _ensure_feedback_table():
    from database import get_db
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS issue_feedback (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    issue_id INT NOT NULL,
                    user_id INT NOT NULL,
                    is_satisfied BOOLEAN NOT NULL,
                    rating TINYINT NULL,
                    comment TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY uniq_issue_user_feedback (issue_id, user_id),
                    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            db.commit()
    finally:
        db.close()


def _column_exists(cursor, table_name, column_name):
    cursor.execute(
        """SELECT 1
           FROM information_schema.columns
           WHERE table_schema = %s AND table_name = %s AND column_name = %s
           LIMIT 1""",
        (Config.DB_NAME, table_name, column_name),
    )
    return cursor.fetchone() is not None


def _ensure_location_and_token_columns():
    from database import get_db
    db = get_db()
    try:
        with db.cursor() as cursor:
            user_columns = {
                "address": "ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL",
                "pincode": "ALTER TABLE users ADD COLUMN pincode VARCHAR(10) NULL",
                "latitude": "ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 7) NULL",
                "longitude": "ALTER TABLE users ADD COLUMN longitude DECIMAL(10, 7) NULL",
            }
            for column_name, ddl in user_columns.items():
                if not _column_exists(cursor, "users", column_name):
                    cursor.execute(ddl)

            if not _column_exists(cursor, "issues", "issue_token"):
                cursor.execute("ALTER TABLE issues ADD COLUMN issue_token VARCHAR(32) NULL")

            cursor.execute(
                """SELECT 1
                   FROM information_schema.statistics
                   WHERE table_schema = %s AND table_name = 'issues' AND index_name = 'uniq_issue_token'
                   LIMIT 1""",
                (Config.DB_NAME,),
            )
            if cursor.fetchone() is None:
                cursor.execute("ALTER TABLE issues ADD UNIQUE KEY uniq_issue_token (issue_token)")

            db.commit()
    finally:
        db.close()


def _ensure_department_tables():
    from database import get_db
    db = get_db()
    try:
        with db.cursor() as cursor:
            # Create departments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS departments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)

            # Create sub_departments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sub_departments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    department_id INT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    description TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
                    UNIQUE KEY uniq_dept_subdept (department_id, name)
                )
            """)

            # Add department_id and sub_department_id to issues table
            if not _column_exists(cursor, "issues", "department_id"):
                cursor.execute("ALTER TABLE issues ADD COLUMN department_id INT NULL")
                cursor.execute("ALTER TABLE issues ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL")

            if not _column_exists(cursor, "issues", "sub_department_id"):
                cursor.execute("ALTER TABLE issues ADD COLUMN sub_department_id INT NULL")
                cursor.execute("ALTER TABLE issues ADD FOREIGN KEY (sub_department_id) REFERENCES sub_departments(id) ON DELETE SET NULL")

            # Insert default departments and sub-departments
            cursor.execute("SELECT COUNT(*) as count FROM departments")
            if cursor.fetchone()["count"] == 0:
                dept_data = [
                    ("Infrastructure", "Roads, drainage, streetlights"),
                    ("Sanitation", "Garbage collection, waste management"),
                    ("Water Supply", "Water leakage, supply issues"),
                    ("Parks & Recreation", "Parks maintenance, public spaces"),
                    ("Safety", "Street safety, security issues"),
                ]
                cursor.executemany("INSERT INTO departments (name, description) VALUES (%s, %s)", dept_data)

                # Get inserted department IDs
                cursor.execute("SELECT id, name FROM departments")
                depts = cursor.fetchall()

                # Map department names to their IDs for sub-department insertion
                dept_map = {d['name']: d['id'] for d in depts}

                sub_dept_data = [
                    (dept_map.get("Infrastructure"), "Pothole", "Potholes and road defects"),
                    (dept_map.get("Infrastructure"), "Road Damage", "Road surface damage"),
                    (dept_map.get("Infrastructure"), "Streetlight", "Streetlight maintenance"),
                    (dept_map.get("Infrastructure"), "Drainage", "Drainage system issues"),
                    (dept_map.get("Sanitation"), "Garbage Overflow", "Garbage collection overflow"),
                    (dept_map.get("Water Supply"), "Water Leakage", "Water pipeline leakage"),
                    (dept_map.get("Parks & Recreation"), "Park Maintenance", "Park maintenance issues"),
                    (dept_map.get("Safety"), "Security", "Public safety concerns"),
                    (dept_map.get("Infrastructure"), "Other", "Other infrastructure issues"),
                ]
                cursor.executemany(
                    "INSERT INTO sub_departments (department_id, name, description) VALUES (%s, %s, %s)",
                    sub_dept_data
                )

            db.commit()
    finally:
        db.close()

with app.app_context():
    try:
        _ensure_upvotes_table()
    except Exception as e:
        print(f"[WARN] Could not create upvotes table on startup: {e}")
    try:
        _ensure_feedback_table()
    except Exception as e:
        print(f"[WARN] Could not create feedback table on startup: {e}")
    try:
        _ensure_location_and_token_columns()
    except Exception as e:
        print(f"[WARN] Could not ensure location/token columns on startup: {e}")
    try:
        _ensure_department_tables()
    except Exception as e:
        print(f"[WARN] Could not create department tables on startup: {e}")

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(issues_bp, url_prefix="/api/issues")


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)


@app.route("/")
@app.route("/api/health")
def health():
    return {"status": "ok", "message": "Civic Issue Portal API running", "docs": "Frontend at http://localhost:5173"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
