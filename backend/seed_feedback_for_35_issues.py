from database import get_db

TARGET_COUNT = 35

COMMENT_TEMPLATES = [
    "Repair quality looks solid and the area is safer now.",
    "Response time was acceptable and the issue appears fully fixed.",
    "Work completion is good, but periodic checks would help.",
    "The team handled the complaint professionally and closed it well.",
    "Issue resolved with proper cleanup after the main fix.",
    "Service quality improved compared to previous reports.",
    "The location is usable again and risk has reduced.",
    "Resolution was practical and completed with good coordination.",
    "Follow-up communication was clear and useful.",
    "The fix seems durable; please maintain similar standards.",
    "Quick closure and visible on-ground improvement.",
    "Problem is addressed and public inconvenience reduced.",
    "Workmanship is neat and effective for this location.",
    "Satisfied with closure, monitor again after heavy rains.",
    "The area condition is much better after the intervention.",
    "Complaint handling was smooth from report to closure.",
    "Resolution is acceptable and meets expectations.",
    "Good execution; issue impact is no longer visible.",
    "The final outcome is positive and practical.",
    "Fix quality is decent and location is now manageable.",
]


def main():
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute(
                """SELECT id, user_id, title, status
                   FROM issues
                   WHERE deleted_at IS NULL
                   ORDER BY id ASC
                   LIMIT %s""",
                (TARGET_COUNT,),
            )
            issues = cursor.fetchall()

            if not issues:
                print("No active issues found")
                return

            processed = 0
            resolved_updates = 0
            processed_ids = []

            for idx, issue in enumerate(issues):
                issue_id = issue["id"]
                user_id = issue["user_id"]
                title = issue.get("title") or "Issue"
                status = issue.get("status")

                # Ensure issue is eligible for feedback flow on UI.
                if status not in {"resolved", "rejected"}:
                    cursor.execute(
                        "UPDATE issues SET status = 'resolved' WHERE id = %s",
                        (issue_id,),
                    )
                    cursor.execute(
                        "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
                        (issue_id, "Issue marked resolved for feedback seeding", user_id),
                    )
                    resolved_updates += 1

                is_satisfied = (idx % 4) != 0
                rating_cycle = [5, 4, 3, 5, 4]
                rating = rating_cycle[idx % len(rating_cycle)]
                template = COMMENT_TEMPLATES[idx % len(COMMENT_TEMPLATES)]
                unique_comment = f"{template} [Issue #{issue_id}: {title[:40]}]"

                cursor.execute(
                    """INSERT INTO issue_feedback (issue_id, user_id, is_satisfied, rating, comment)
                       VALUES (%s, %s, %s, %s, %s)
                       ON DUPLICATE KEY UPDATE
                         is_satisfied = VALUES(is_satisfied),
                         rating = VALUES(rating),
                         comment = VALUES(comment),
                         created_at = CURRENT_TIMESTAMP""",
                    (issue_id, user_id, is_satisfied, rating, unique_comment),
                )

                cursor.execute(
                    "INSERT INTO issue_timeline (issue_id, action, performed_by) VALUES (%s, %s, %s)",
                    (issue_id, "Feedback seeded with varied comment", user_id),
                )

                processed += 1
                processed_ids.append(issue_id)

            db.commit()

            # Verify coverage and diversity
            cursor.execute(
                """SELECT COUNT(*) AS c
                   FROM issue_feedback f
                   JOIN issues i ON i.id = f.issue_id
                   WHERE i.deleted_at IS NULL"""
            )
            total_feedback_for_active = cursor.fetchone()["c"]

            if processed_ids:
                placeholders = ",".join(["%s"] * len(processed_ids))
                cursor.execute(
                    f"""SELECT COUNT(DISTINCT comment) AS c
                        FROM issue_feedback
                        WHERE issue_id IN ({placeholders})""",
                    tuple(processed_ids),
                )
                distinct_comments = cursor.fetchone()["c"]
            else:
                distinct_comments = 0

            print(f"Processed issues: {processed}")
            print(f"Updated to resolved: {resolved_updates}")
            print(f"Feedback rows for active issues: {total_feedback_for_active}")
            print(f"Distinct comments in target set: {distinct_comments}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
