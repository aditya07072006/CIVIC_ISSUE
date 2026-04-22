from database import get_db

TARGET_EMAIL = "a0572241@gmail.com"

COMMENTS = [
    "Resolved on time. Good work by the department.",
    "Issue fixed properly. Please keep monitoring the area.",
    "Satisfied with resolution quality.",
    "Work completed well and location is now safe.",
    "Thanks for quick action. Resolution was effective.",
]


def main():
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT id, name, email FROM users WHERE email = %s LIMIT 1",
                (TARGET_EMAIL,),
            )
            user = cursor.fetchone()
            if not user:
                print(f"User not found: {TARGET_EMAIL}")
                return

            user_id = user["id"]

            cursor.execute(
                """SELECT id, status, title
                   FROM issues
                   WHERE user_id = %s AND deleted_at IS NULL
                   ORDER BY id ASC""",
                (user_id,),
            )
            issues = cursor.fetchall()

            if not issues:
                print("No active issues found for this user")
                return

            resolved_count = 0
            feedback_upserts = 0

            for idx, issue in enumerate(issues):
                issue_id = issue["id"]
                status = issue["status"]

                if status not in {"resolved", "rejected"}:
                    cursor.execute(
                        "UPDATE issues SET status = 'resolved' WHERE id = %s",
                        (issue_id,),
                    )
                    cursor.execute(
                        "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
                        (issue_id, "Issue marked resolved for feedback collection", user_id),
                    )
                    resolved_count += 1

                rating = 5 if idx % 2 == 0 else 4
                comment = COMMENTS[idx % len(COMMENTS)]

                cursor.execute(
                    """INSERT INTO issue_feedback (issue_id, user_id, is_satisfied, rating, comment)
                       VALUES (%s, %s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                         is_satisfied = VALUES(is_satisfied),
                         rating = VALUES(rating),
                         comment = VALUES(comment),
                         created_at = CURRENT_TIMESTAMP""",
                    (issue_id, user_id, True, rating, comment),
                )
                cursor.execute(
                    "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
                    (issue_id, "Citizen feedback recorded", user_id),
                )
                feedback_upserts += 1

            db.commit()

            print(f"User: {user['name']} ({user['email']})")
            print(f"Total issues processed: {len(issues)}")
            print(f"Issues auto-resolved for feedback: {resolved_count}")
            print(f"Feedback records upserted: {feedback_upserts}")

            cursor.execute(
                "SELECT COUNT(*) AS c FROM issue_feedback WHERE user_id = %s",
                (user_id,),
            )
            print("Total feedback rows for user:", cursor.fetchone()["c"])

    finally:
        db.close()


if __name__ == "__main__":
    main()
