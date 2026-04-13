import random
from datetime import datetime

import bcrypt

from database import get_db


THANE_USERS = [
    {
        "name": "Aarya Patil",
        "email": "aarya.patil@thane.in",
        "password": "Citizen@123",
        "address": "Naupada, Thane",
        "pincode": "400602",
        "latitude": 19.1964,
        "longitude": 72.9674,
    },
    {
        "name": "Rahul Shinde",
        "email": "rahul.shinde@thane.in",
        "password": "Citizen@123",
        "address": "Vartak Nagar, Thane",
        "pincode": "400606",
        "latitude": 19.2189,
        "longitude": 72.9569,
    },
]


THANE_ISSUES = [
    {
        "title": "Streetlight not working near station road",
        "description": "Streetlight has been off for several nights and the lane is very dark after 9 PM.",
        "category": "streetlight",
        "severity": "high",
        "address": "Station Road, Thane West",
        "latitude": 19.1866,
        "longitude": 72.9754,
        "status": "in_progress",
        "priority": "high",
        "sla_hours": 48,
    },
    {
        "title": "Large pothole at Teen Hath Naka",
        "description": "Deep pothole causing traffic slowdown and two-wheeler imbalance during peak hours.",
        "category": "pothole",
        "severity": "critical",
        "address": "Teen Hath Naka Junction, Thane",
        "latitude": 19.2018,
        "longitude": 72.9798,
        "status": "pending",
        "priority": "emergency",
        "sla_hours": 72,
    },
    {
        "title": "Garbage overflowing near local market",
        "description": "Collection point is overflowing since morning, foul smell spreading nearby.",
        "category": "garbage",
        "severity": "medium",
        "address": "Jambli Naka Market, Thane",
        "latitude": 19.1936,
        "longitude": 72.9785,
        "status": "resolved",
        "priority": "normal",
        "sla_hours": 24,
    },
    {
        "title": "Water leakage from roadside pipeline",
        "description": "Continuous leakage from underground line creating waterlogging near bus stop.",
        "category": "water_leakage",
        "severity": "high",
        "address": "Pokhran Road No. 2, Thane",
        "latitude": 19.2262,
        "longitude": 72.9710,
        "status": "pending",
        "priority": "high",
        "sla_hours": 24,
    },
    {
        "title": "Drainage blockage near service lane",
        "description": "Drain water is not flowing and dirty water is collecting on the road edge.",
        "category": "drainage",
        "severity": "medium",
        "address": "Ghodbunder Service Road, Thane",
        "latitude": 19.2542,
        "longitude": 72.9654,
        "status": "in_progress",
        "priority": "normal",
        "sla_hours": 48,
    },
    {
        "title": "Road surface cracking at busy junction",
        "description": "Multiple cracks developing into uneven patches, causing difficult driving conditions.",
        "category": "road_damage",
        "severity": "high",
        "address": "Majiwada Junction, Thane",
        "latitude": 19.2141,
        "longitude": 72.9894,
        "status": "pending",
        "priority": "high",
        "sla_hours": 72,
    },
    {
        "title": "Garbage bins not cleared for two days",
        "description": "Residential collection bins are full and waste is spilling onto the footpath.",
        "category": "garbage",
        "severity": "high",
        "address": "Kopri Colony, Thane",
        "latitude": 19.1845,
        "longitude": 72.9816,
        "status": "resolved",
        "priority": "high",
        "sla_hours": 24,
    },
    {
        "title": "Broken divider reflectors causing visibility issue",
        "description": "Reflective studs on divider are broken, making night driving unsafe.",
        "category": "other",
        "severity": "medium",
        "address": "Eastern Express Highway stretch, Thane",
        "latitude": 19.2057,
        "longitude": 72.9910,
        "status": "rejected",
        "priority": "normal",
        "sla_hours": 48,
    },
    {
        "title": "Streetlight flickering near school gate",
        "description": "Streetlight keeps flickering and goes off repeatedly after evening.",
        "category": "streetlight",
        "severity": "low",
        "address": "Uthalsar Road, Thane",
        "latitude": 19.1979,
        "longitude": 72.9667,
        "status": "pending",
        "priority": "low",
        "sla_hours": 48,
    },
    {
        "title": "Pothole near bus depot entrance",
        "description": "Large pothole right at depot entrance causing sudden braking and splashing.",
        "category": "pothole",
        "severity": "high",
        "address": "Thane Bus Depot Entrance, Thane",
        "latitude": 19.1901,
        "longitude": 72.9789,
        "status": "in_progress",
        "priority": "high",
        "sla_hours": 72,
    },
    {
        "title": "Water leakage near housing society valve",
        "description": "Possible valve damage leading to continuous leak beside society compound wall.",
        "category": "water_leakage",
        "severity": "medium",
        "address": "Hiranandani Estate, Thane",
        "latitude": 19.2621,
        "longitude": 72.9658,
        "status": "resolved",
        "priority": "normal",
        "sla_hours": 24,
    },
    {
        "title": "Drainage cover displaced near footpath",
        "description": "Drainage manhole cover is shifted and creates hazard for pedestrians.",
        "category": "drainage",
        "severity": "critical",
        "address": "Panch Pakhadi, Thane",
        "latitude": 19.1968,
        "longitude": 72.9709,
        "status": "pending",
        "priority": "emergency",
        "sla_hours": 48,
    },
    {
        "title": "Road edge erosion after recent rains",
        "description": "Road shoulder has eroded and loose gravel is spreading into the carriageway.",
        "category": "road_damage",
        "severity": "medium",
        "address": "Kolshet Road, Thane",
        "latitude": 19.2354,
        "longitude": 72.9833,
        "status": "in_progress",
        "priority": "normal",
        "sla_hours": 72,
    },
    {
        "title": "Uncollected construction debris on roadside",
        "description": "Construction rubble left on roadside narrowing lane and causing dust.",
        "category": "other",
        "severity": "low",
        "address": "Balkum Naka, Thane",
        "latitude": 19.2218,
        "longitude": 72.9976,
        "status": "pending",
        "priority": "low",
        "sla_hours": 48,
    },
]


def _column_exists(cursor, table_name, column_name):
    cursor.execute(
        """SELECT 1
           FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = %s AND column_name = %s
           LIMIT 1""",
        (table_name, column_name),
    )
    return cursor.fetchone() is not None


def _ensure_required_columns(db):
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
               WHERE table_schema = DATABASE() AND table_name = 'issues' AND index_name = 'uniq_issue_token'
               LIMIT 1"""
        )
        if cursor.fetchone() is None:
            cursor.execute("ALTER TABLE issues ADD UNIQUE KEY uniq_issue_token (issue_token)")

    db.commit()


def _issue_token():
    return f"THN-{datetime.now().strftime('%Y%m%d')}-{random.randint(100000, 999999)}"


def _create_user_if_needed(db, user):
    with db.cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE email = %s", (user["email"],))
        existing = cursor.fetchone()
        if existing:
            return existing["id"], False

        hashed = bcrypt.hashpw(user["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            """INSERT INTO users (name, email, password, role, address, pincode, latitude, longitude)
               VALUES (%s, %s, %s, 'citizen', %s, %s, %s, %s)""",
            (
                user["name"],
                user["email"],
                hashed,
                user["address"],
                user["pincode"],
                user["latitude"],
                user["longitude"],
            ),
        )
        return cursor.lastrowid, True


def _create_issue_if_needed(db, issue, user_id):
    with db.cursor() as cursor:
        cursor.execute(
            """SELECT id FROM issues
               WHERE title = %s AND user_id = %s AND deleted_at IS NULL
               LIMIT 1""",
            (issue["title"], user_id),
        )
        existing = cursor.fetchone()
        if existing:
            return existing["id"], False

        token = _issue_token()
        cursor.execute(
            """INSERT INTO issues (
                   title, description, category, severity, latitude, longitude,
                   image, address, issue_token, status, priority, sla_hours, user_id
               ) VALUES (%s, %s, %s, %s, %s, %s, NULL, %s, %s, %s, %s, %s, %s)""",
            (
                issue["title"],
                issue["description"],
                issue["category"],
                issue["severity"],
                issue["latitude"],
                issue["longitude"],
                issue["address"],
                token,
                issue["status"],
                issue["priority"],
                issue["sla_hours"],
                user_id,
            ),
        )
        issue_id = cursor.lastrowid
        cursor.execute(
            "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
            (issue_id, "Issue reported by citizen", user_id),
        )
        return issue_id, True


def seed_data():
    db = get_db()
    try:
        _ensure_required_columns(db)

        created_users = 0
        created_issues = 0
        user_ids = []

        for user in THANE_USERS:
            user_id, is_created = _create_user_if_needed(db, user)
            created_users += 1 if is_created else 0
            user_ids.append(user_id)

        for idx, issue in enumerate(THANE_ISSUES):
            owner_id = user_ids[idx % len(user_ids)]
            _, is_created = _create_issue_if_needed(db, issue, owner_id)
            created_issues += 1 if is_created else 0

        db.commit()
        print(f"Users added: {created_users}")
        print(f"Issues added: {created_issues}")
        print("Seed completed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()