import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MapPin, LayoutDashboard, LogOut, ShieldCheck, Menu, X, Plus, Activity } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const citizenLinks = [
    { to: "/dashboard", label: "My Issues", icon: <LayoutDashboard size={15} /> },
    { to: "/report", label: "Report Issue", icon: <Plus size={15} /> },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: <ShieldCheck size={15} /> },
  ];

  const links = user?.role === "admin" ? adminLinks : citizenLinks;

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: "rgba(5,11,20,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }}>
              <Activity size={16} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity"
              style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }} />
          </div>
          <span className="font-bold text-base gradient-text hidden sm:block">CivicPortal</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                style={active ? {
                  background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(168,85,247,0.15))",
                  border: "1px solid rgba(34,211,238,0.2)",
                } : {}}
              >
                {l.icon}
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* User + Logout */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #22d3ee, #a855f7)" }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-slate-300">{user?.name}</span>
            {user?.role === "admin" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}>
                ADMIN
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 py-3 flex flex-col gap-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,11,20,0.95)" }}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === l.to
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
              style={location.pathname === l.to ? {
                background: "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(168,85,247,0.1))",
                border: "1px solid rgba(34,211,238,0.15)",
              } : {}}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-1"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
