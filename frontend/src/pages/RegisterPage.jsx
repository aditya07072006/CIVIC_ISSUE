import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Activity, ArrowRight, Users, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const perks = [
  "Track every issue you report in real-time",
  "Get notified when status changes",
  "View issues on an interactive map",
  "Priority scoring for critical problems",
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
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
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />

        <div className="relative z-10 max-w-sm animate-fade-up">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }}>
              <Activity size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CivicPortal</span>
          </div>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <Users size={28} style={{ color: "#22d3ee" }} />
          </div>

          <h2 className="text-3xl font-black text-white mb-3">
            Join <span className="gradient-text">50,000+</span> citizens
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Making cities better, one report at a time. Create your free account and start making a difference today.
          </p>

          <div className="flex flex-col gap-3.5">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 size={16} style={{ color: "#22d3ee", shrink: 0 }} />
                <p className="text-sm text-slate-300">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === RIGHT PANEL === */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:max-w-md xl:max-w-lg">
        <div className="w-full max-w-sm animate-fade-up delay-100">
          {/* Mobile logo + back */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }}>
                <Activity size={16} className="text-white" />
              </div>
              <span className="font-bold gradient-text">CivicPortal</span>
            </div>
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Home</Link>
          </div>

          {/* Desktop back link */}
          <div className="hidden lg:block mb-6">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to Home</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-slate-500 mt-1 text-sm">Free forever. No credit card needed.</p>
          </div>

          <div className="glass-strong rounded-2xl p-7"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
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
                <Link to="/login" className="font-medium" style={{ color: "#22d3ee" }}>
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
