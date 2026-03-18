export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.address?.road ? `${data.address.road}, ${data.address.city || data.address.town || data.address.county || "India"}` : 
           `${data.address?.city || data.address?.town || data.address?.county || "Unknown Location"}`;
  } catch {
    return null;
  }
}
