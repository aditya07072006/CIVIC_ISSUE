import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Input";
import { MapPicker } from "../components/map/MapPicker";
import { reverseGeocode } from "../utils/geocoding";
import { AlertTriangle, Upload, MapPin, Navigation, CheckCircle2, Zap, Download, ShieldCheck, ArrowRight } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value: "pothole", label: "Pothole" },
  { value: "garbage", label: "Garbage Overflow" },
  { value: "water_leakage", label: "Water Leakage" },
  { value: "streetlight", label: "Broken Streetlight" },
  { value: "road_damage", label: "Road Damage" },
  { value: "drainage", label: "Drainage Issue" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const THANE_CENTER = { lat: 19.2183, lng: 72.9781 };
const THANE_RADIUS_METERS = 18000;
const THANE_BOUNDS = {
  minLat: 19.11,
  maxLat: 19.34,
  minLng: 72.90,
  maxLng: 73.08,
};

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

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "pothole",
    severity: "medium",
    latitude: "",
    longitude: "",
    address: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const handleDownloadReceipt = async () => {
    if (!receipt?.id) return;
    try {
      const res = await api.get(`/issues/${receipt.id}/receipt`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `issue-receipt-${receipt.issue_token || receipt.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to download receipt");
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    toast.loading("Fetching address details...", { id: "geo-addr" });
    const addr = await reverseGeocode(lat, lng);
    setForm((f) => ({ ...f, address: addr || "" }));
    toast.dismiss("geo-addr");
  };

  const handleGeolocate = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Detecting your location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({
          ...f,
          latitude: lat,
          longitude: lng,
        }));
        toast.dismiss("geo");
        toast.loading("Fetching address details...", { id: "geo-addr" });
        const addr = await reverseGeocode(lat, lng);
        setForm((f) => ({ ...f, address: addr || "" }));
        toast.dismiss("geo-addr");
        toast.success("Location detected! Address fetched. Marker placed on map.", { id: "geo" });
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Please allow location access in your browser settings, or click on the map to pick a location manually.",
          2: "Location unavailable. Please click on the map to pick a location manually.",
          3: "Location request timed out. Please click on the map to pick a location manually.",
        };
        toast.error(messages[err.code] || "Failed to get location. Click the map to select manually.", { id: "geo", duration: 5000 });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error("Please select issue location on the map");
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const isInsideBounds =
      lat >= THANE_BOUNDS.minLat &&
      lat <= THANE_BOUNDS.maxLat &&
      lng >= THANE_BOUNDS.minLng &&
      lng <= THANE_BOUNDS.maxLng;

    if (!isInsideBounds) {
      toast.error("Only issues within Thane are allowed");
      return;
    }

    const distance = haversineMeters(lat, lng, THANE_CENTER.lat, THANE_CENTER.lng);
    if (distance > THANE_RADIUS_METERS) {
      toast.error("Only issues within Thane are allowed");
      return;
    }
    if (!form.address.trim()) {
      toast.error("Address is required and must be in Thane");
      return;
    }
    if (!form.address.toLowerCase().includes("thane")) {
      toast.error("Issue address must be in Thane");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);

    try {
      const res = await api.post("/issues", fd);
      const issueData = res.data || {};
      setReceipt({ id: issueData.id, issue_token: issueData.issue_token });
      toast.success(`Issue reported successfully. Token: ${issueData.issue_token || issueData.id}`);
    } catch (err) {
      if (err.response?.data?.error === "duplicate") {
        toast.error(err.response.data.message);
      } else {
        toast.error(err.response?.data?.error || "Failed to report issue");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"10%",left:"5%",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(15,61,145,0.08) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"15%",right:"5%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)"}} />
      </div>

      <div className="relative z-10 w-full px-4 py-6 md:px-6">
        <Card className="overflow-hidden border border-slate-200/70 mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <ShieldCheck size={14} /> Civic Report Portal
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    Report a Civic Issue
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    Help improve your city. Every report counts, and the municipal authority reviews all submissions.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Ready to submit?</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">Use location, attach evidence, and send it in one flow.</p>
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Issue Details */}
          <Card className="border border-slate-200/70 p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>1</span>
              Issue Details
            </div>
            <Input
              label="Issue Title"
              placeholder="e.g. Large pothole on Main Street"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Textarea
              label="Description"
              placeholder="Describe the issue in detail — location clues, how long it's been there, impact on residents…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <Input
              label="Address"
              placeholder="e.g. Near Main Street, Ward 4"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl text-sm text-slate-800 px-3 py-2.5 outline-none transition-all"
                  style={{background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.18)"}}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} style={{background:"#ffffff",color:"#0f172a"}}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full rounded-xl text-sm text-slate-800 px-3 py-2.5 outline-none transition-all"
                  style={{background:"rgba(255,255,255,0.96)",border:"1px solid rgba(15,61,145,0.18)"}}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value} style={{background:"#ffffff",color:"#0f172a"}}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Severity visual pills */}
            <div className="flex gap-2 flex-wrap -mt-1">
              {SEVERITIES.map((s) => {
                const active = form.severity === s.value;
                const colors = {low:"#10b981",medium:"#f59e0b",high:"#f97316",critical:"#ef4444"};
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm({...form, severity: s.value})}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: active ? `${colors[s.value]}22` : "rgba(255,255,255,0.96)",
                      border: `1px solid ${active ? colors[s.value] : "rgba(15,61,145,0.14)"}`,
                      color: active ? colors[s.value] : "#64748b",
                    }}
                  >{s.label}</button>
                );
              })}
            </div>
          </Card>

          {/* Photo Evidence */}
          <Card className="border border-slate-200/70 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>2</span>
              Photo Evidence
              <span className="ml-1 text-xs font-normal text-slate-500">(optional but recommended)</span>
            </div>
            <label
              className="flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all group"
              style={{
                border: imagePreview ? "2px solid rgba(34,211,238,0.4)" : "2px dashed rgba(34,211,238,0.25)",
                background: imagePreview ? "transparent" : "rgba(34,211,238,0.03)",
                minHeight: 140,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {imagePreview ? (
                <div className="relative w-full">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-56 object-cover rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                    style={{background:"rgba(0,0,0,0.5)"}}>
                    <p className="text-white text-sm font-medium">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                    style={{background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.2)"}}>
                    <Upload size={22} className="text-cyan-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Drop photo here or click to browse</p>
                  <p className="text-slate-500 text-xs">PNG, JPG, WEBP · up to 10 MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </Card>

          {/* Location */}
          <Card className="border border-slate-200/70 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>3</span>
                Issue Location
              </div>
              <button
                type="button"
                onClick={handleGeolocate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Navigation size={13} /> Use My Location
              </button>
            </div>
            {form.latitude && form.longitude && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 size={13} />
                Location set: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
              </div>
            )}
            <MapPicker
              lat={form.latitude}
              lng={form.longitude}
              address={form.address}
              onLocationSelect={handleLocationSelect}
              onInvalidLocation={(msg) => toast.error(msg)}
            />
            
            {!form.latitude && (
              <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={11} /> Click the map to pin the issue location</p>
            )}
          </Card>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2 text-white/80">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Submitting…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <AlertTriangle size={18} /> Submit Issue Report
              </span>
            )}
          </button>

          {receipt?.id && (
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Issue submitted successfully</p>
                <p className="mt-1 text-xs text-emerald-700">Token No: {receipt.issue_token || receipt.id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                >
                  <Download size={14} /> Download PDF Receipt
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/receipts")}
                  className="rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700"
                >
                  Go to Receipt Downloads
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
