import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Activity, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import toast from "react-hot-toast";

const features = [
  { icon: <Zap size={18} />, title: "Instant Reporting", desc: "Submit issues in under 60 seconds with photo & GPS" },
  { icon: <Globe size={18} />, title: "Live Tracking", desc: "Watch your issues move from pending to resolved in real-time" },
  { icon: <Shield size={18} />, title: "AI Priority Engine", desc: "Smart severity scoring for faster municipal response" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-bg flex">
      {/* === LEFT PANEL === */}
      <div className="hidden lg:flex flex-col flex-1 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #a855f7, transparent)" }} />

        <div className="relative z-10 max-w-md animate-fade-up">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }}>
              <Activity size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">CivicPortal</span>
          </div>

          <h2 className="text-4xl font-black text-white mb-3 leading-tight">
            Your voice,<br />
            <span className="gradient-text">your city.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            The smart platform connecting citizens with municipal authorities to fix civic issues faster than ever.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stat bar */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[["2,400+", "Issues Fixed"], ["98%", "Response Rate"], ["<24h", "Avg. SLA"]].map(([val, lab]) => (
              <div key={lab} className="text-center">
                <p className="text-xl font-black gradient-text">{val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{lab}</p>
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
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">← Back to Home</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
          </div>

          <div className="glass-strong rounded-2xl p-7"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
                Sign In
                {!loading && <ArrowRight size={16} />}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-slate-500 text-sm">
                No account?{" "}
                <Link to="/register" className="font-medium" style={{ color: "#22d3ee" }}>
                  Create one free
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="mt-5 p-4 rounded-xl"
              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#c084fc" }}>🔐 Admin Demo</p>
              <p className="text-xs text-slate-400">admin@civic.gov · Admin@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
