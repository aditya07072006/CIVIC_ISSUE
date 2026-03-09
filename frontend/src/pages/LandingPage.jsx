import { Link } from "react-router-dom";
import {
  MapPin, Shield, Zap, Users, BarChart3, CheckCircle, ArrowRight,
  AlertTriangle, Droplets, Lightbulb, Trash2, Construction, Star,
} from "lucide-react";

const FEATURES = [
  { icon: MapPin, title: "Geo-tagged Reports", desc: "Pin issues on an interactive map. Exact location, instant visibility for civic teams.", color: "#22d3ee" },
  { icon: Shield, title: "Track in Real-Time", desc: "Monitor your report's lifecycle from submission to resolution with live status updates.", color: "#a855f7" },
  { icon: Zap, title: "Fast Response", desc: "Municipal teams are notified instantly. Average resolution time under 48 hours.", color: "#f59e0b" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Admins get full analytics — trend charts, category breakdowns, and CSV export.", color: "#10b981" },
  { icon: Users, title: "Community Upvotes", desc: "Upvote issues your neighbours reported. Higher votes get prioritised automatically.", color: "#f97316" },
  { icon: CheckCircle, title: "Photo Evidence", desc: "Attach photos to your report for faster diagnosis and verification by authorities.", color: "#06b6d4" },
];

const CATEGORIES = [
  { icon: Construction, label: "Potholes", color: "#ef4444" },
  { icon: Trash2, label: "Garbage", color: "#f97316" },
  { icon: Droplets, label: "Water Leakage", color: "#3b82f6" },
  { icon: Lightbulb, label: "Streetlights", color: "#f59e0b" },
  { icon: AlertTriangle, label: "Road Damage", color: "#f97316" },
  { icon: MapPin, label: "Drainage", color: "#22d3ee" },
];

const STATS = [
  { value: "2,400+", label: "Issues Resolved" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "<48h", label: "Avg. Resolution" },
  { value: "50+", label: "Wards Covered" },
];

export default function LandingPage() {
  return (
    <div className="animated-bg min-h-screen overflow-x-hidden text-slate-100">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{position:"absolute",top:"-10%",left:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.07) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",top:"30%",right:"-5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)"}} />
        <div style={{position:"absolute",bottom:"-10%",left:"30%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.04) 0%,transparent 70%)"}} />
      </div>

      {/* ─── Navbar ─────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5"
        style={{background:"rgba(5,11,20,0.8)",backdropFilter:"blur(20px)"}}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>
            <MapPin size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">CivicPortal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-1.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
            style={{border:"1px solid rgba(255,255,255,0.1)"}}>
            Sign In
          </Link>
          <Link to="/register"
            className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)",boxShadow:"0 0 20px rgba(34,211,238,0.25)"}}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative z-10 text-center px-4 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.25)",color:"#22d3ee"}}>
          <Zap size={11} /> Now serving 50+ municipal wards
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
          Your City, Your Voice.
          <br />
          <span className="gradient-text">Report. Track. Resolve.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          CivicPortal connects citizens directly with municipal authorities. Report civic issues 
          with photo evidence, track resolution in real-time, and help build a better city — together.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:scale-105"
            style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)",boxShadow:"0 0 40px rgba(34,211,238,0.35)"}}>
            Report an Issue <ArrowRight size={18} />
          </Link>
          <Link to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-slate-300 hover:text-white text-base transition-all"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
            Sign In to Dashboard
          </Link>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass-strong rounded-2xl p-6 text-center">
              <p className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-3">Everything you need to make change</h2>
          <p className="text-slate-400 max-w-xl mx-auto">From reporting to resolution, we make civic engagement simple, transparent, and impactful.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const FeatureIcon = feat.icon;
            return (
              <div key={feat.title} className="glass rounded-2xl p-6 group hover:border-white/15 transition-all"
                style={{border:"1px solid rgba(255,255,255,0.07)"}}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{background:`${feat.color}18`,border:`1px solid ${feat.color}30`}}>
                  <FeatureIcon size={22} style={{color:feat.color}} />
                </div>
                <h3 className="font-semibold text-slate-100 mb-1.5">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Categories ──────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">Issue Categories</p>
          <h2 className="text-3xl font-bold text-slate-100">We cover every type of civic problem</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.label} className="glass rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center group hover:scale-105 transition-all cursor-default"
                style={{border:"1px solid rgba(255,255,255,0.07)"}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{background:`${cat.color}18`,border:`1px solid ${cat.color}30`}}>
                  <CatIcon size={20} style={{color:cat.color}} />
                </div>
                <span className="text-xs font-medium text-slate-300">{cat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">How It Works</p>
          <h2 className="text-3xl font-bold text-slate-100">Three simple steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Create an account", desc: "Register for free in under a minute. No paperwork, no waiting." },
            { step: "02", title: "Report the issue", desc: "Fill in the details, attach a photo, and pin the exact location on the map." },
            { step: "03", title: "Track resolution", desc: "Watch real-time status updates as the team investigates and resolves your issue." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="glass-strong rounded-2xl p-7 relative overflow-hidden">
              <span className="absolute top-4 right-5 text-5xl font-black text-white/3 select-none">{step}</span>
              <div className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-widest">{step}</div>
              <h3 className="font-bold text-slate-100 text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Community</p>
          <h2 className="text-3xl font-bold text-slate-100">Trusted by thousands of citizens</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Priya Sharma", ward: "Ward 12", msg: "Reported a broken streetlight. Fixed within 2 days! Amazing service.", rating: 5 },
            { name: "Rahul Menon", ward: "Ward 7", msg: "The pothole that caused accidents for months got fixed after I reported here.", rating: 5 },
            { name: "Anita Joshi", ward: "Ward 23", msg: "Finally a way to actually be heard. My garbage overflow complaint was resolved in 48hrs.", rating: 5 },
          ].map(({ name, ward, msg, rating }) => (
            <div key={name} className="glass rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex gap-0.5">
                {Array.from({length: rating}).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic">"{msg}"</p>
              <div className="mt-auto pt-2 border-t border-white/5">
                <p className="font-semibold text-slate-100 text-sm">{name}</p>
                <p className="text-slate-500 text-xs">{ward}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="glass-strong rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0"
            style={{background:"radial-gradient(ellipse at center,rgba(34,211,238,0.08) 0%,transparent 70%)"}} />
          <h2 className="text-3xl md:text-4xl font-black text-slate-100 mb-4 relative z-10">
            Ready to make your city better?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto relative z-10">
            Join thousands of active citizens. Registration is free, instant, and takes less than a minute.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap relative z-10">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white text-base transition-all hover:scale-105"
              style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)",boxShadow:"0 0 40px rgba(34,211,238,0.35)"}}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-slate-300 hover:text-white text-base transition-all"
              style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center text-xs text-slate-500"
        style={{background:"rgba(5,11,20,0.6)"}}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{background:"linear-gradient(135deg,#22d3ee,#a855f7)"}}>
            <MapPin size={12} className="text-white" />
          </div>
          <span className="font-semibold text-slate-400">CivicPortal</span>
        </div>
        <p>© {new Date().getFullYear()} CivicPortal · Empowering citizens, improving cities</p>
      </footer>
    </div>
  );
}
