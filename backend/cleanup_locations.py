"""
Cleanup script to remove or fix issues with locations outside Thane district.
Run this script to ensure all issues are within Thane boundaries.
"""

import math
from database import get_db
from location_guard import is_within_thane_coordinates

def haversine_meters(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in meters."""
    r = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def cleanup_non_thane_issues():
    """Remove all issues with locations outside Thane district."""
    db = get_db()
    try:
        with db.cursor() as cursor:
            # Get all issues with coordinates
            cursor.execute("""
                SELECT id, latitude, longitude, title, address
                FROM issues 
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                AND deleted_at IS NULL
            """)
            
            issues = cursor.fetchall()
            non_thane_count = 0
            thane_count = 0
            
            print(f"\n{'='*60}")
            print(f"Scanning {len(issues)} issues for Thane location validation...")
            print(f"{'='*60}\n")
            
            for issue in issues:
                issue_id = issue['id']
                lat = float(issue['latitude'])
                lon = float(issue['longitude'])
                title = issue['title']
                address = issue['address'] or 'No address'
                
                # Check if within Thane bounds
                if not is_within_thane_coordinates(lat, lon):
                    non_thane_count += 1
                    print(f"❌ Issue #{issue_id}: OUTSIDE THANE")
                    print(f"   Title: {title}")
                    print(f"   Address: {address}")
                    print(f"   Coords: {lat}, {lon}\n")
                    
                    # Delete issue
                    cursor.execute(
                        "UPDATE issues SET deleted_at = NOW() WHERE id = %s",
                        (issue_id,)
                    )
                else:
                    thane_count += 1
            
            db.commit()
            
            print(f"\n{'='*60}")
            print(f"CLEANUP RESULTS:")
            print(f"{'='*60}")
            print(f"✅ Issues WITHIN Thane: {thane_count}")
            print(f"❌ Issues REMOVED (Outside Thane): {non_thane_count}")
            print(f"{'='*60}\n")
            
            return {"kept": thane_count, "removed": non_thane_count}
            
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def validate_thane_boundaries():
    """Validate and display Thane boundaries."""
    from location_guard import THANE_CENTER_LAT, THANE_CENTER_LNG, THANE_RADIUS_METERS
    
    print(f"\n{'='*60}")
    print(f"THANE DISTRICT BOUNDARIES:")
    print(f"{'='*60}")
    print(f"Center Latitude: {THANE_CENTER_LAT}")
    print(f"Center Longitude: {THANE_CENTER_LNG}")
    print(f"Radius: {THANE_RADIUS_METERS} meters ({THANE_RADIUS_METERS/1000:.1f} km)")
    print(f"{'='*60}\n")


def get_issue_stats():
    """Get statistics about issue locations."""
    db = get_db()
    try:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 ELSE 0 END) as with_coords,
                    SUM(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 ELSE 0 END) as without_coords,
                    SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted
                FROM issues
            """)
            
            stats = cursor.fetchone()
            
            print(f"\n{'='*60}")
            print(f"ISSUE STATISTICS:")
            print(f"{'='*60}")
            print(f"Total Issues: {stats['total']}")
            print(f"Issues with Coordinates: {stats['with_coords']}")
            print(f"Issues without Coordinates: {stats['without_coords']}")
            print(f"Deleted Issues: {stats['deleted']}")
            print(f"Active Issues: {stats['total'] - (stats['deleted'] or 0)}")
            print(f"{'='*60}\n")
            
            return stats
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🔍 THANE LOCATION CLEANUP UTILITY\n")
    
    # Show Thane boundaries
    validate_thane_boundaries()
    
    # Get current stats
    print("📊 Before cleanup:")
    get_issue_stats()
    
    # Run cleanup
    print("🧹 Running cleanup...")
    result = cleanup_non_thane_issues()
    
    # Show stats after cleanup
    if result:
        print("\n📊 After cleanup:")
        get_issue_stats()
        print("✅ Cleanup completed successfully!\n")
    else:
        print("❌ Cleanup failed. Please check the error above.\n")
