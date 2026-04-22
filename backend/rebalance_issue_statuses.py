from database import get_db

STATUSES = ["pending", "in_progress", "resolved", "rejected"]


def main():
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT id, user_id, status, title
                   FROM issues
                   WHERE deleted_at IS NULL
                   ORDER BY id ASC"""
            )
            issues = cursor.fetchall()
            if not issues:
                print("No active issues found")
                return

            updates = []
            for index, issue in enumerate(issues):
                new_status = STATUSES[index % len(STATUSES)]
                if issue["status"] != new_status:
                    cursor.execute(
                        "UPDATE issues SET status = %s WHERE id = %s",
                        (new_status, issue["id"]),
                    )
                    cursor.execute(
                        "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
                        (
                            issue["id"],
                            f"Status normalized to {new_status} for variety",
                            issue["user_id"],
                        ),
                    )
                updates.append((issue["id"], issue["title"], issue["status"], new_status))

            db.commit()

            cursor.execute(
                "SELECT status, COUNT(*) AS c FROM issues WHERE deleted_at IS NULL GROUP BY status ORDER BY status"
            )
            counts = cursor.fetchall()

            print(f"Updated {len(updates)} active issues")
            for item in updates:
                print(f"#{item[0]} | {item[1]} | {item[2]} -> {item[3]}")
            print("Final distribution:", counts)
    finally:
        db.close()


if __name__ == "__main__":
    main()
