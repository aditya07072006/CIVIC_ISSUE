"""
Script to seed sample issues with valid Thane locations.
Run this if you need to populate the database with test issues in Thane.
"""

from database import get_db
import datetime


# Valid Thane coordinates (within Thane city boundaries)
THANE_LOCATIONS = [
    {
        "title": "Pothole near Thane Station",
        "description": "Large pothole on the main road near Thane railway station",
        "category": "pothole",
        "severity": "high",
        "latitude": 19.2183,
        "longitude": 72.9781,
        "address": "Thane Railway Station, Thane, Maharashtra"
    },
    {
        "title": "Water Leakage in Thane West",
        "description": "Major water pipeline leakage in residential area",
        "category": "water_leakage",
        "severity": "critical",
        "latitude": 19.2245,
        "longitude": 72.9615,
        "address": "Thane West, Thane, Maharashtra"
    },
    {
        "title": "Garbage Overflow at Ghodbunder Road",
        "description": "Overflowing garbage dump causing sanitation issues",
        "category": "garbage",
        "severity": "medium",
        "latitude": 19.2356,
        "longitude": 72.9890,
        "address": "Ghodbunder Road, Thane, Maharashtra"
    },
    {
        "title": "Broken Streetlight in Eastern suburbs",
        "description": "Non-functional streetlight on main commercial road",
        "category": "streetlight",
        "severity": "low",
        "latitude": 19.2456,
        "longitude": 73.0156,
        "address": "Eastern Suburbs, Thane, Maharashtra"
    },
    {
        "title": "Road Damage on Ghodbunder Road",
        "description": "Severe road damage with potholes making it difficult for vehicles",
        "category": "road_damage",
        "severity": "high",
        "latitude": 19.2290,
        "longitude": 72.9950,
        "address": "Ghodbunder Road, Thane, Maharashtra"
    },
    {
        "title": "Drainage Issue at Kolshet Road",
        "description": "Blocked drainage causing water stagnation",
        "category": "drainage",
        "severity": "medium",
        "latitude": 19.2180,
        "longitude": 72.9845,
        "address": "Kolshet Road, Thane, Maharashtra"
    },
    {
        "title": "Pothole at Lodha Paradise",
        "description": "Multiple potholes near residential complex",
        "category": "pothole",
        "severity": "medium",
        "latitude": 19.2310,
        "longitude": 72.9720,
        "address": "Lodha Paradise, Thane, Maharashtra"
    },
    {
        "title": "Water Supply Issue in Parsipada",
        "description": "Water leakage from main supply line",
        "category": "water_leakage",
        "severity": "high",
        "latitude": 19.2500,
        "longitude": 72.9500,
        "address": "Parsipada, Thane, Maharashtra"
    },
    {
        "title": "Streetlight Flickering at Market",
        "description": "Streetlight flickering intermittently causing safety issues",
        "category": "streetlight",
        "severity": "medium",
        "latitude": 19.2200,
        "longitude": 72.9750,
        "address": "Thane Market Area, Maharashtra"
    },
    {
        "title": "Road Edge Erosion after Rains",
        "description": "Road shoulder eroding due to recent heavy rainfall",
        "category": "road_damage",
        "severity": "high",
        "latitude": 19.2400,
        "longitude": 73.0050,
        "address": "Thane Region, Maharashtra"
    },
    {
        "title": "Drainage Cover Displaced",
        "description": "Manhole cover displaced creating hazard for pedestrians",
        "category": "drainage",
        "severity": "critical",
        "latitude": 19.2150,
        "longitude": 72.9825,
        "address": "Downtown Thane, Maharashtra"
    },
    {
        "title": "Garbage Overflow near School",
        "description": "Garbage collection point overflowing near school area",
        "category": "garbage",
        "severity": "high",
        "latitude": 19.2350,
        "longitude": 72.9650,
        "address": "School Area, Thane, Maharashtra"
    },
    {
        "title": "Multiple Potholes on Highway",
        "description": "Series of potholes making the highway dangerous",
        "category": "pothole",
        "severity": "critical",
        "latitude": 19.2520,
        "longitude": 73.0250,
        "address": "Thane-Navi Mumbai Highway, Maharashtra"
    },
    {
        "title": "Water Leak on Sion Road",
        "description": "Active water leakage from underground pipeline",
        "category": "water_leakage",
        "severity": "medium",
        "latitude": 19.2280,
        "longitude": 72.9550,
        "address": "Sion Road, Thane, Maharashtra"
    },
    {
        "title": "Street Cleanliness Issue",
        "description": "Accumulation of garbage on streets affecting cleanliness",
        "category": "garbage",
        "severity": "low",
        "latitude": 19.2380,
        "longitude": 72.9780,
        "address": "Central Thane, Maharashtra"
    },
]


def seed_thane_locations():
    """Add sample issues with valid Thane locations."""
    db = get_db()
    try:
        with db.cursor() as cursor:
            run_tag = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            
            print(f"\n{'='*60}")
            print(f"SEEDING THANE LOCATIONS")
            print(f"{'='*60}\n")
            
            added = 0
            for index, location_data in enumerate(THANE_LOCATIONS, start=1):
                unique_title = f"{location_data['title']} [THANE-{run_tag}-{index}]"
                cursor.execute("""
                    INSERT INTO issues 
                    (title, description, category, severity, latitude, longitude, 
                     address, status, priority, sla_hours, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s, 48, 1)
                """,
                (
                    unique_title,
                    location_data['description'],
                    location_data['category'],
                    location_data['severity'],
                    location_data['latitude'],
                    location_data['longitude'],
                    location_data['address'],
                    'high' if location_data['severity'] in ['critical', 'high'] else 'normal'
                ))
                
                print(f"✅ Added: {unique_title}")
                print(f"   Location: {location_data['latitude']}, {location_data['longitude']}")
                print(f"   Address: {location_data['address']}\n")
                added += 1
            
            db.commit()
            
            print(f"{'='*60}")
            print(f"✅ Successfully added {added} issues with Thane locations!")
            print(f"{'='*60}\n")
            
    except Exception as e:
        print(f"Error seeding locations: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🌍 THANE LOCATIONS SEEDING UTILITY\n")
    seed_thane_locations()
    print("✨ Done!\n")
