import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "../ui/Badge";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const severityColors = {
  low: "green",
  medium: "orange",
  high: "red",
  critical: "purple",
};

function createColoredIcon(color) {
  return L.divIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export function IssueMap({ issues }) {
  const center = [20.5937, 78.9629];

  return (
    <div className="border border-slate-600 rounded-xl overflow-hidden" style={{ height: 400 }}>
      <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {issues
          .filter((i) => i.latitude && i.longitude)
          .map((issue) => (
            <Marker
              key={issue.id}
              position={[parseFloat(issue.latitude), parseFloat(issue.longitude)]}
              icon={createColoredIcon(severityColors[issue.severity] || "blue")}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>{issue.title}</p>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                    {issue.category} • {issue.severity}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 11,
                      background: issue.status === "resolved" ? "#d1fae5" : "#fef3c7",
                      color: issue.status === "resolved" ? "#065f46" : "#92400e",
                    }}
                  >
                    {issue.status}
                  </span>
                  {issue.image && (
                    <img
                      src={`/uploads/${issue.image}`}
                      alt="issue"
                      style={{ width: "100%", marginTop: 8, borderRadius: 6, maxHeight: 100, objectFit: "cover" }}
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
