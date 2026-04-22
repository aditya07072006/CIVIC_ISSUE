# 🧹 Location Cleanup & Validation Guide

## Overview

This guide helps you:
1. **Clean up** issues with locations outside Thane district
2. **Validate** that all issues are within proper Thane boundaries
3. **Seed** sample issues with valid Thane locations for testing

---

## Scripts Available

### 1. `cleanup_locations.py` - Remove Non-Thane Issues

**Purpose:** Identifies and removes all issues with coordinates outside Thane district.

**What it does:**
- ✅ Scans all active issues
- ✅ Checks if each issue is within Thane boundaries
- ✅ Soft-deletes issues outside Thane (sets `deleted_at` timestamp)
- ✅ Shows detailed report of removed issues
- ✅ Displays statistics before and after cleanup

**Usage:**
```bash
cd backend
python cleanup_locations.py
```

**Example Output:**
```
============================================================
ISSUE STATISTICS:
============================================================
Total Issues: 150
Issues with Coordinates: 145
Issues without Coordinates: 5
Deleted Issues: 8
Active Issues: 142
============================================================

🔍 Scanning 145 issues for Thane location validation...

❌ Issue #42: OUTSIDE THANE
   Title: Pothole in Mumbai
   Address: Mumbai, Maharashtra
   Coords: 19.0760, 72.8777

❌ Issue #78: OUTSIDE THANE
   ...

✅ Issues WITHIN Thane: 135
❌ Issues REMOVED (Outside Thane): 10
```

---

### 2. `seed_thane_locations.py` - Add Sample Thane Issues

**Purpose:** Populates database with 15 sample issues at valid Thane locations.

**What it does:**
- ✅ Adds 15 test issues across different categories
- ✅ Uses real Thane coordinates
- ✅ Covers all issue types (pothole, water, garbage, streetlight, drainage, road_damage)
- ✅ Prevents duplicate seeding if data already exists
- ✅ Shows detailed confirmation for each added issue

**Sample Locations Included:**
- Thane Railway Station
- Thane West
- Ghodbunder Road
- Eastern Suburbs
- Kolshet Road
- Lodha Paradise
- Parsipada
- Thane Market Area
- Downtown Thane
- And 6 more locations...

**Usage:**
```bash
cd backend
python seed_thane_locations.py
```

**Example Output:**
```
🌍 THANE LOCATIONS SEEDING UTILITY

============================================================
SEEDING THANE LOCATIONS
============================================================

✅ Added: Pothole near Thane Station
   Location: 19.2183, 72.9781
   Address: Thane Railway Station, Thane, Maharashtra

✅ Added: Water Leakage in Thane West
   Location: 19.2245, 72.9615
   Address: Thane West, Thane, Maharashtra

✅ Added: Garbage Overflow at Ghodbunder Road
   ...

============================================================
✅ Successfully added 15 issues with Thane locations!
============================================================
```

---

## Complete Cleanup Workflow

Follow these steps to ensure a clean database:

### Step 1: Backup Your Database (Recommended)
```bash
# Create a backup of your database before cleanup
mysqldump -u root -p civic_issue_portal > backup_$(date +%Y%m%d).sql
```

### Step 2: View Current Statistics
```bash
cd backend
python -c "from cleanup_locations import get_issue_stats; get_issue_stats()"
```

### Step 3: Run Cleanup
```bash
python cleanup_locations.py
```

This will:
- Show all issues outside Thane
- Soft-delete them (preserves data integrity)
- Display summary statistics

### Step 4: Seed Valid Thane Issues (Optional)
```bash
python seed_thane_locations.py
```

This adds 15 test issues if needed for demonstration.

### Step 5: Verify Results
```bash
python -c "from cleanup_locations import get_issue_stats; get_issue_stats()"
```

---

## Thane District Boundaries

**Current Configuration:**

| Parameter | Value |
|-----------|-------|
| **Center Latitude** | 19.2183° N |
| **Center Longitude** | 72.9781° E |
| **Radius** | 25 km |
| **Area** | ~1,960 sq.km |

**Major Areas Covered:**
- ✅ Thane City Center
- ✅ Thane West
- ✅ Thane East
- ✅ Ghodbunder Road
- ✅ Kolshet Road
- ✅ Lodha Paradise
- ✅ Parsipada
- ✅ Eastern Suburbs
- ✅ Thane-Navi Mumbai Highway

**Valid Postcodes:**
```
400601, 400602, 400603, 400604, 400605, 400606, 400607, 
400608, 400610, 400612, 400614, 400615
```

---

## Cleanup Details

### What Gets Removed?
- ✅ Issues with coordinates outside 25km radius of Thane center
- ✅ Issues with invalid address (not in Thane)
- ✅ Preserves data by soft-deleting (sets `deleted_at`)

### What Gets Kept?
- ✅ Issues within Thane boundaries (verified by coordinates)
- ✅ Issues with valid Thane addresses
- ✅ All issue history and timeline

### Restoration
If you need to restore deleted issues:
```sql
-- View deleted issues
SELECT * FROM issues WHERE deleted_at IS NOT NULL;

-- Restore specific issue
UPDATE issues SET deleted_at = NULL WHERE id = 123;

-- Restore all deleted issues
UPDATE issues SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
```

---

## All Issues Page Impact

After cleanup, the **All Issues** page will:
- ✅ Show only issues within Thane
- ✅ Have more reliable geographic filtering
- ✅ Display accurate map locations
- ✅ Improve data quality for reporting

---

## Troubleshooting

### Script won't run
```bash
# Ensure database connection is working
python -c "from database import get_db; db = get_db(); print('Connected'); db.close()"
```

### No issues were removed
- All existing issues might already be in Thane
- Or they don't have valid coordinates
- Check: `SELECT COUNT(*) FROM issues WHERE latitude IS NOT NULL;`

### Need to restore deleted issues
```bash
# Database keeps them soft-deleted
# You can restore individual issues or all of them
python -c "from database import get_db; db = get_db(); 
cursor = db.cursor(); 
cursor.execute('UPDATE issues SET deleted_at = NULL WHERE deleted_at IS NOT NULL'); 
db.commit(); 
db.close(); 
print('Restored all deleted issues')"
```

---

## Automation (Optional)

To run cleanup automatically on startup, add to `backend/app.py`:

```python
with app.app_context():
    try:
        _ensure_upvotes_table()
    except Exception as e:
        print(f"[WARN] Could not create upvotes table: {e}")
    
    # ... existing setup code ...
    
    # Auto-cleanup non-Thane issues on startup (optional)
    try:
        from cleanup_locations import cleanup_non_thane_issues
        result = cleanup_non_thane_issues()
    except Exception as e:
        print(f"[WARN] Could not run location cleanup: {e}")
```

---

## References

- **Thane City**: Thane District in Maharashtra, India
- **Coordinates**: Using WGS84 (EPSG:4326)
- **Distance Calculation**: Haversine formula
- **Validation**: Multiple checks (coordinates + address)

---

## Next Steps

1. ✅ Run cleanup script
2. ✅ Verify statistics
3. ✅ Optionally seed test data
4. ✅ Test the "All Issues" page
5. ✅ Verify map displays correctly
6. ✅ Check Department view

---

**Status:** Ready to use

Need help? Check the backend logs for detailed error messages.
