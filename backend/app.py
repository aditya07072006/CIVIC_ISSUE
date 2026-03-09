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

with app.app_context():
    try:
        _ensure_upvotes_table()
    except Exception as e:
        print(f"[WARN] Could not create upvotes table on startup: {e}")

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
