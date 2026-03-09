import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import { MapPicker } from "../components/map/MapPicker";
import { AlertTriangle, Upload, MapPin, Navigation, CheckCircle2, Zap } from "lucide-react";
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

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "pothole",
    severity: "medium",
    latitude: "",
    longitude: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Detecting your location...", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        toast.success("Location detected! Marker placed on map.", { id: "geo" });
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

    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);

    try {
      await api.post("/issues", fd);
      toast.success("Issue reported successfully!");
      navigate("/dashboard");
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
    <div className="animated-bg min-h-screen relative overflow-x-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"10%",left:"5%",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.07) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"15%",right:"5%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)"}} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.25)",color:"#22d3ee"}}>
            <Zap size={11} /> Civic Report Portal
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Report a Civic Issue</h1>
          <p className="text-slate-400 text-sm">Help improve your city — every report counts. The municipal authority reviews all submissions.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Issue Details */}
          <div className="glass-strong rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-white/5 pb-3">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl text-sm text-slate-100 px-3 py-2.5 outline-none transition-all"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} style={{background:"#0f172a"}}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full rounded-xl text-sm text-slate-100 px-3 py-2.5 outline-none transition-all"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value} style={{background:"#0f172a"}}>{s.label}</option>
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
                      background: active ? `${colors[s.value]}22` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? colors[s.value] : "rgba(255,255,255,0.08)"}`,
                      color: active ? colors[s.value] : "#64748b",
                    }}
                  >{s.label}</button>
                );
              })}
            </div>
          </div>

          {/* Photo Evidence */}
          <div className="glass-strong rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 border-b border-white/5 pb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>2</span>
              Photo Evidence
              <span className="text-slate-500 font-normal ml-1 text-xs">(optional but recommended)</span>
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
                  <p className="text-slate-300 font-medium text-sm">Drop photo here or click to browse</p>
                  <p className="text-slate-500 text-xs">PNG, JPG, WEBP · up to 10 MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Location */}
          <div className="glass-strong rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>3</span>
                Issue Location
              </div>
              <button
                type="button"
                onClick={handleGeolocate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.2)",color:"#22d3ee"}}
              >
                <Navigation size={13} /> Use My Location
              </button>
            </div>
            {form.latitude && form.longitude && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",color:"#10b981"}}>
                <CheckCircle2 size={13} />
                Location set: {parseFloat(form.latitude).toFixed(5)}, {parseFloat(form.longitude).toFixed(5)}
              </div>
            )}
            <MapPicker lat={form.latitude} lng={form.longitude} onLocationSelect={handleLocationSelect} />
            {!form.latitude && (
              <p className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={11} /> Click the map to pin the issue location</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all relative overflow-hidden"
            style={{
              background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#22d3ee,#a855f7)",
              boxShadow: loading ? "none" : "0 0 40px rgba(34,211,238,0.3)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2 text-slate-400">
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Submitting…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <AlertTriangle size={18} /> Submit Issue Report
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
