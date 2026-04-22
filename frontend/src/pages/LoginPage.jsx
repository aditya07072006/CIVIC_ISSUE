import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40">
      <div className="w-full px-4 py-6 md:px-8">
        <Card className="overflow-hidden border border-slate-200/70">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200">
                    <Activity size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Civic Issue Portal</p>
                    <p className="text-xs text-slate-500">Citizen access portal</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
                    Your voice,
                  </h1>
                  <p className="text-4xl font-semibold tracking-tight text-blue-700 md:text-6xl">
                    your city.
                  </p>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  The smart platform connecting citizens with municipal authorities to fix civic issues faster than ever.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {features.map((f) => (
                    <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        {f.icon}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-xl">
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                  <Link to="/" className="hover:text-slate-700 transition-colors">← Back to Home</Link>
                  <Link to="/register" className="hover:text-slate-700 transition-colors">Create account</Link>
                </div>

                <Card className="border border-slate-200/70 p-6 md:p-7">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
                    <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
                  </div>

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

                    <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
                      Sign In
                      {!loading && <ArrowRight size={16} />}
                    </Button>
                  </form>

                  <div className="mt-5 text-center">
                    <p className="text-sm text-slate-500">
                      No account?{" "}
                      <Link to="/register" className="font-medium text-blue-700 hover:text-blue-800">
                        Create one free
                      </Link>
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="mb-1.5 text-xs font-semibold text-violet-700">Admin Demo</p>
                    <p className="text-xs text-slate-600">admin@civic.gov · Admin@123</p>
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
