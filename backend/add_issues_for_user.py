import uuid
from datetime import datetime

from database import get_db

TARGET_EMAIL = "a0572241@gmail.com"

ISSUES = [
    (
        "Pothole near Naupada signal",
        "Deep pothole causing traffic slowdown near Naupada junction.",
        "pothole",
        "high",
        19.1948,
        72.9667,
        "Naupada, Thane, Maharashtra",
    ),
    (
        "Garbage overflow at Wagle Estate",
        "Garbage bins are overflowing and causing foul smell.",
        "garbage",
        "medium",
        19.2045,
        72.9543,
        "Wagle Estate, Thane, Maharashtra",
    ),
    (
        "Streetlight not working at Majiwada",
        "Streetlight has been off for 3 days near Majiwada junction.",
        "streetlight",
        "low",
        19.2209,
        72.9788,
        "Majiwada, Thane, Maharashtra",
    ),
    (
        "Water leakage near Vartak Nagar",
        "Continuous pipeline leak on the roadside.",
        "water_leakage",
        "critical",
        19.2175,
        72.9559,
        "Vartak Nagar, Thane, Maharashtra",
    ),
    (
        "Drainage blockage at Kopri",
        "Drain water is backing up near the lane entrance.",
        "drainage",
        "medium",
        19.2012,
        72.9735,
        "Kopri, Thane, Maharashtra",
    ),
]

SLA_HOURS = {
    "garbage": 24,
    "streetlight": 48,
    "pothole": 72,
    "road_damage": 72,
    "water_leakage": 24,
    "drainage": 48,
    "other": 48,
}

PRIORITY_MAP = {
    "low": "low",
    "medium": "normal",
    "high": "high",
    "critical": "emergency",
}


def make_token() -> str:
    return f"THN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def main() -> None:
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, email FROM users WHERE email = %s LIMIT 1",
                (TARGET_EMAIL,),
            )
            user = cursor.fetchone()
            if not user:
                print(f"User not found for email: {TARGET_EMAIL}")
                return

            user_id = user["id"]
            added = []
            for title, description, category, severity, lat, lon, address in ISSUES:
                token = make_token()
                cursor.execute(
                    """
                    INSERT INTO issues (
                        title, description, category, severity,
                        latitude, longitude, address,
                        issue_token, status, priority, sla_hours, user_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s, %s, %s)
                    """,
                    (
                        title,
                        description,
                        category,
                        severity,
                        lat,
                        lon,
                        address,
                        token,
                        PRIORITY_MAP[severity],
                        SLA_HOURS[category],
                        user_id,
                    ),
                )
                issue_id = cursor.lastrowid
                cursor.execute(
                    "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
                    (issue_id, "Issue reported by citizen", user_id),
                )
                added.append((issue_id, token, title))

            db.commit()

            print(f"Inserted {len(added)} issues for {user['name']} ({user['email']})")
            for issue_id, token, title in added:
                print(f"- #{issue_id} | {token} | {title}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
