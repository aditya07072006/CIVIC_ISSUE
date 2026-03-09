import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function ClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPicker({ lat, lng, onLocationSelect }) {
  const defaultCenter = [20.5937, 78.9629]; // India center

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        📍 <strong className="text-slate-300">Click anywhere on the map</strong> to drop a pin at the issue location
        {" "}— or use the "Use My Location" button above (requires browser permission).
      </p>
      <div className="map-container border border-slate-600 rounded-xl overflow-hidden">
        <MapContainer
          center={lat && lng ? [lat, lng] : defaultCenter}
          zoom={lat && lng ? 15 : 5}
          style={{ height: "350px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onLocationSelect={onLocationSelect} />
          {lat && lng && <Marker position={[lat, lng]} />}
        </MapContainer>
      </div>
      {lat && lng && (
        <p className="text-xs text-slate-400 mt-1.5">
          Selected: {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}
        </p>
      )}
    </div>
  );
}
