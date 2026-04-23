import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40">
      <div className="w-full px-4 py-6 md:px-8">
        <Card className="overflow-hidden border border-slate-200/70">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200">
                    <Activity size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Civic Issue Portal</p>
                    <p className="text-xs text-slate-500">Citizen registration</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">Join</h1>
                  <p className="text-4xl font-semibold tracking-tight text-blue-700 md:text-6xl">50,000+ citizens</p>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Making cities better, one report at a time. Create your free account and start making a difference today.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {perks.map((p) => (
                    <div key={p} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <CheckCircle2 size={18} />
                      </div>
                      <p className="text-sm text-slate-700">{p}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-2xl">
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                  <Link to="/" className="hover:text-slate-700 transition-colors">← Back to Home</Link>
                  <Link to="/login" className="hover:text-slate-700 transition-colors">Sign in</Link>
                </div>

                <Card className="border border-slate-200/70 p-6 md:p-7">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">Create account</h2>
                    <p className="mt-1 text-sm text-slate-500">Free forever. No credit card needed.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input label="Full Name" type="text" placeholder="Aditya Bangar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    <Input label="Address" type="text" placeholder="Enter your Thane address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                    <Input label="Pincode" type="text" placeholder="e.g. 400601" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} error={pincodeError} required />

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">Pick your location in Thane (required for registration)</p>
                        <button
                          type="button"
                          onClick={handleGeolocate}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
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

                    <Input label="Password" type="password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />

                    <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
                      Create Account
                      {!loading && <ArrowRight size={16} />}
                    </Button>
                  </form>

                  <div className="mt-5 text-center">
                    <p className="text-sm text-slate-500">
                      Already have an account?{" "}
                      <Link to="/login" className="font-medium text-blue-700 hover:text-blue-800">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
