import math

# Approximate center of Thane city and an inclusive radius for municipal area checks.
THANE_CENTER_LAT = 19.2183
THANE_CENTER_LNG = 72.9781
THANE_RADIUS_METERS = 25000
THANE_PINCODES = {
    "400601", "400602", "400603", "400604", "400605",
    "400606", "400607", "400608", "400610", "400612",
    "400614", "400615",
}


def _haversine_meters(lat1, lon1, lat2, lon2):
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


def is_thane_address(address):
    if not address:
        return False
    return "thane" in address.strip().lower()


def is_thane_pincode(pincode):
    if not pincode:
        return False
    pin = str(pincode).strip()
    return pin in THANE_PINCODES


def is_within_thane_coordinates(latitude, longitude):
    distance = _haversine_meters(latitude, longitude, THANE_CENTER_LAT, THANE_CENTER_LNG)
    return distance <= THANE_RADIUS_METERS
