import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { MapPicker } from "../components/map/MapPicker";
import { reverseGeocode } from "../utils/geocoding";
import { Activity, ArrowRight, Users, CheckCircle2, Navigation } from "lucide-react";
import toast from "react-hot-toast";

const perks = [
  "Track every issue you report in real-time",
  "Get notified when status changes",
  "View issues on an interactive map",
  "Priority scoring for critical problems",
];

const THANE_CENTER = { lat: 19.2183, lng: 72.9781 };
const THANE_RADIUS_METERS = 25000;
const THANE_PINCODES = new Set([
  "400601", "400602", "400603", "400604", "400605", "400606",
  "400607", "400608", "400610", "400612", "400614", "400615",
]);

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    address: "",
    pincode: "",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);

  const pincode = form.pincode.trim();
  const pincodeError =
    pincode.length === 6 && !THANE_PINCODES.has(pincode)
      ? "Pincode is not valid for Thane"
      : "";

  const handleLocationSelect = async (lat, lng) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    toast.loading("Fetching address details...", { id: "reg-geo-addr" });
    const addr = await reverseGeocode(lat, lng);
    if (addr) setForm((f) => ({ ...f, address: addr }));
    toast.dismiss("reg-geo-addr");
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Detecting your location...", { id: "reg-geo" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await handleLocationSelect(lat, lng);
        toast.success("Location captured", { id: "reg-geo" });
      },
      () => toast.error("Failed to get location", { id: "reg-geo" }),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!form.address.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      toast.error("Pincode must be 6 digits");
      return;
    }
    if (!THANE_PINCODES.has(form.pincode.trim())) {
      toast.error("Only Thane pincodes are allowed");
      return;
    }
    if (!form.latitude || !form.longitude) {
      toast.error("Please select your location on the map");
      return;
    }
    if (!form.address.toLowerCase().includes("thane")) {
      toast.error("Registration is allowed only for Thane residents");
      return;
    }
    const distance = haversineMeters(
      parseFloat(form.latitude),
      parseFloat(form.longitude),
      THANE_CENTER.lat,
      THANE_CENTER.lng
    );
    if (distance > THANE_RADIUS_METERS) {
      toast.error("Selected location is outside Thane");
      return;
    }
    setLoading(true);
    try {
      await register(
        form.name,
        form.email,
        form.password,
        form.address,
        form.pincode,
        form.latitude,
        form.longitude
      );
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg flex">
      {/* === LEFT PANEL === */}
      <div className="hidden lg:flex flex-col flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #1c5bbf, transparent)" }} />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />

        <div className="relative z-10 max-w-sm animate-fade-up">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0f3d91, #1c5bbf)" }}>
              <Activity size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CivicPortal</span>
          </div>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(15,61,145,0.1)", border: "1px solid rgba(15,61,145,0.2)" }}>
            <Users size={28} style={{ color: "#0f3d91" }} />
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-3">
            Join <span className="gradient-text">50,000+</span> citizens
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Making cities better, one report at a time. Create your free account and start making a difference today.
          </p>

          <div className="flex flex-col gap-3.5">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 size={16} style={{ color: "#0f3d91", shrink: 0 }} />
                <p className="text-sm text-slate-300">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === RIGHT PANEL === */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:max-w-2xl xl:max-w-3xl">
        <div className="w-full max-w-2xl animate-fade-up delay-100">
          {/* Mobile logo + back */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0f3d91, #1c5bbf)" }}>
                <Activity size={16} className="text-white" />
              </div>
              <span className="font-bold gradient-text">CivicPortal</span>
            </div>
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">← Home</Link>
          </div>

          {/* Desktop back link */}
          <div className="hidden lg:block mb-6">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">← Back to Home</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Create account</h1>
            <p className="text-slate-500 mt-1 text-sm">Free forever. No credit card needed.</p>
          </div>

          <div className="glass-strong rounded-2xl p-7"
            style={{ border: "1px solid rgba(15,61,145,0.14)" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Input
                label="Address"
                type="text"
                placeholder="Enter your Thane address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
              <Input
                label="Pincode"
                type="text"
                placeholder="e.g. 400601"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                error={pincodeError}
                required
              />
              <div className="rounded-xl border border-slate-600/40 p-3 space-y-3" style={{ background: "rgba(15,61,145,0.04)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Pick your location in Thane (required for registration)</p>
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(15,61,145,0.1)", border: "1px solid rgba(15,61,145,0.2)", color: "#0f3d91" }}
                  >
                    <Navigation size={12} /> Use My Location
                  </button>
                </div>
                <MapPicker
                  lat={form.latitude}
                  lng={form.longitude}
                  address={form.address}
                  onLocationSelect={handleLocationSelect}
                  onInvalidLocation={(msg) => toast.error(msg)}
                />
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />

              <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
                Create Account
                {!loading && <ArrowRight size={16} />}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="font-medium" style={{ color: "#0f3d91" }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
