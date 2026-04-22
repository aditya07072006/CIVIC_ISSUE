import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
  MapPin, Shield, Zap, Users, BarChart3, CheckCircle, ArrowRight,
  AlertTriangle, Droplets, Lightbulb, Trash2, Construction, Star,
} from "lucide-react";

const FEATURES = [
  { icon: MapPin, title: "Geo-tagged Reports", desc: "Pin issues on an interactive map. Exact location, instant visibility for civic teams.", color: "#1d4ed8" },
  { icon: Shield, title: "Track in Real-Time", desc: "Monitor your report's lifecycle from submission to resolution with live status updates.", color: "#0f3d91" },
  { icon: Zap, title: "Fast Response", desc: "Municipal teams are notified instantly. Average resolution time under 48 hours.", color: "#f59e0b" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Admins get full analytics — trend charts, category breakdowns, and CSV export.", color: "#10b981" },
  { icon: Users, title: "Community Upvotes", desc: "Upvote issues your neighbours reported. Higher votes get prioritised automatically.", color: "#f97316" },
  { icon: CheckCircle, title: "Photo Evidence", desc: "Attach photos to your report for faster diagnosis and verification by authorities.", color: "#1f8a4c" },
];

const CATEGORIES = [
  { icon: Construction, label: "Potholes", color: "#ef4444" },
  { icon: Trash2, label: "Garbage", color: "#f97316" },
  { icon: Droplets, label: "Water Leakage", color: "#3b82f6" },
  { icon: Lightbulb, label: "Streetlights", color: "#f59e0b" },
  { icon: AlertTriangle, label: "Road Damage", color: "#f97316" },
  { icon: MapPin, label: "Drainage", color: "#1d4ed8" },
];

const STATS = [
  { value: "2,400+", label: "Issues Resolved" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "<48h", label: "Avg. Resolution" },
  { value: "50+", label: "Wards Covered" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-linear-to-br from-slate-50 via-blue-50/60 to-amber-50/40 text-slate-900">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"-10%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(15,61,145,0.08) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",top:"30%",right:"-5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"-10%",left:"30%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(15,61,145,0.05) 0%,transparent 70%)"}} />
      </div>

      <div className="relative z-10 px-4 py-4 md:px-6">
        <Card className="w-full border border-slate-200/70 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-200">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Civic Issue Portal</p>
                <p className="text-xs text-slate-500">Report. Track. Resolve.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <section className="relative z-10 px-4 pb-20 pt-14 md:pt-20">
        <div className="w-full">
          <Card className="overflow-hidden border border-slate-200/70">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(15,61,145,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] px-6 py-10 md:px-10 md:py-14">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl space-y-5 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <Zap size={11} /> Now serving 50+ municipal wards
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                      Your City, Your Voice.
                    </h1>
                    <p className="text-4xl font-semibold tracking-tight text-blue-700 md:text-5xl lg:text-6xl">
                      Report. Track. Resolve.
                    </p>
                  </div>
                  <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 md:text-lg lg:mx-0">
                    Civic Issue Portal connects citizens directly with municipal authorities. Report civic issues with photo evidence, track resolution in real-time, and help build a better city together.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                    <Link to="/register" className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5">
                      Report an Issue <ArrowRight size={18} />
                    </Link>
                    <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                      Sign In to Dashboard
                    </Link>
                  </div>
                </div>

                <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-xl">
                  {STATS.map((s) => (
                    <div key={s.label} className="glass-strong rounded-3xl border border-white/70 p-5 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{s.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-900">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <Badge variant="resolved">Features</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">Everything you need to make change</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">From reporting to resolution, we make civic engagement simple, transparent, and impactful.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const FeatureIcon = feat.icon;
            return (
              <Card key={feat.title} className="border border-slate-200/70 p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{background:`${feat.color}18`,border:`1px solid ${feat.color}30`}}>
                  <FeatureIcon size={22} style={{color:feat.color}} />
                </div>
                <h3 className="mb-1.5 font-semibold text-slate-900">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{feat.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── Categories ──────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <Badge variant="pending">Issue Categories</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">We cover every type of civic problem</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <Card key={cat.label} className="flex cursor-default flex-col items-center gap-2.5 rounded-2xl border border-slate-200/70 p-4 text-center transition-transform duration-200 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{background:`${cat.color}18`,border:`1px solid ${cat.color}30`}}>
                  <CatIcon size={20} style={{color:cat.color}} />
                </div>
                <span className="text-xs font-medium text-slate-700">{cat.label}</span>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <Badge variant="pending">How It Works</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">Three simple steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Create an account", desc: "Register for free in under a minute. No paperwork, no waiting." },
            { step: "02", title: "Report the issue", desc: "Fill in the details, attach a photo, and pin the exact location on the map." },
            { step: "03", title: "Track resolution", desc: "Watch real-time status updates as the team investigates and resolves your issue." },
          ].map(({ step, title, desc }) => (
            <Card key={step} className="relative overflow-hidden border border-slate-200/70 p-7">
              <span className="absolute top-4 right-5 text-5xl font-black text-white/3 select-none">{step}</span>
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">{step}</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <Badge variant="resolved">Community</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900">Trusted by thousands of citizens</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Priya Sharma", ward: "Ward 12", msg: "Reported a broken streetlight. Fixed within 2 days! Amazing service.", rating: 5 },
            { name: "Rahul Menon", ward: "Ward 7", msg: "The pothole that caused accidents for months got fixed after I reported here.", rating: 5 },
            { name: "Anita Joshi", ward: "Ward 23", msg: "Finally a way to actually be heard. My garbage overflow complaint was resolved in 48hrs.", rating: 5 },
          ].map(({ name, ward, msg, rating }) => (
            <Card key={name} className="flex flex-col gap-3 border border-slate-200/70 p-6">
              <div className="flex gap-0.5">
                {Array.from({length: rating}).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed italic text-slate-600">"{msg}"</p>
              <div className="mt-auto border-t border-slate-200 pt-2">
                <p className="text-sm font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">{ward}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <Card className="overflow-hidden border border-slate-200/70 p-10 text-center md:p-14 relative">
          <div className="pointer-events-none absolute inset-0"
            style={{background:"radial-gradient(ellipse at center,rgba(15,61,145,0.09) 0%,transparent 70%)"}} />
          <h2 className="relative z-10 mb-4 text-3xl font-semibold text-slate-900 md:text-4xl">
            Ready to make your city better?
          </h2>
          <p className="relative z-10 mx-auto mb-8 max-w-lg text-slate-600">
            Join thousands of active citizens. Registration is free, instant, and takes less than a minute.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap relative z-10">
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-transform hover:-translate-y-0.5">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              Sign In
            </Link>
          </div>
        </Card>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/90 px-6 py-8 text-center text-xs text-slate-500 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-linear-to-br from-blue-600 to-cyan-600">
            <MapPin size={12} className="text-white" />
          </div>
          <span className="font-semibold text-slate-700">Civic Issue Portal</span>
        </div>
        <p>© {new Date().getFullYear()} Civic Issue Portal · Empowering citizens, improving cities</p>
      </footer>
    </div>
  );
}
