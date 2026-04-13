import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const THANE_CENTER = { lat: 19.2183, lng: 72.9781 };
const THANE_RADIUS_METERS = 25000;
const THANE_BOUNDS = [
  [18.99, 72.74],
  [19.45, 73.22],
];

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function ClickHandler({ onLocationSelect, onInvalidLocation }) {
  useMapEvents({
    click(e) {
      const distance = haversineMeters(e.latlng.lat, e.latlng.lng, THANE_CENTER.lat, THANE_CENTER.lng);
      if (distance > THANE_RADIUS_METERS) {
        onInvalidLocation?.("Please select a location within Thane");
        return;
      }
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPicker({ lat, lng, address, onLocationSelect, onInvalidLocation }) {
  const defaultCenter = [THANE_CENTER.lat, THANE_CENTER.lng];

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        📍 <strong className="text-slate-300">Click on the Thane map area</strong> to drop a pin at the issue location
        {" "}— or use the "Use My Location" button above (requires browser permission).
      </p>
      <div className="map-container border border-slate-600 rounded-xl overflow-hidden">
        <MapContainer
          center={lat && lng ? [lat, lng] : defaultCenter}
          zoom={lat && lng ? 15 : 12}
          minZoom={11}
          maxBounds={THANE_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: "350px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onLocationSelect={onLocationSelect} onInvalidLocation={onInvalidLocation} />
          {lat && lng && <Marker position={[lat, lng]} />}
        </MapContainer>
      </div>
      {lat && lng && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-slate-400">
            📍 Coordinates: {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}
          </p>
          {address && (
            <p className="text-sm text-cyan-300 font-medium">
              📮 {address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
