import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Activity, LayoutDashboard, Plus, ShieldCheck, LogOut,
  X, Map, BarChart2, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";

const citizenLinks = [
  { to: "/dashboard", label: "My Issues", icon: LayoutDashboard },
  { to: "/report",    label: "Report Issue", icon: Plus },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: ShieldCheck },
];

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = user?.role === "admin" ? adminLinks : citizenLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? "72px" : "240px",
          background: "rgba(5,11,20,0.97)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
          transform: open || window.innerWidth >= 768 ? "translateX(0)" : "translateX(-100%)",
          // On mobile: controlled by `open`, on desktop always visible
        }}
      >
        {/* ── Logo ── */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}
          >
            <Activity size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base gradient-text whitespace-nowrap">
              CivicPortal
            </span>
          )}

          {/* Close button – mobile only */}
          <button
            onClick={onClose}
            className="ml-auto text-slate-500 hover:text-slate-200 transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Nav Links ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
          {links.map((link) => {
            const NavIcon = link.icon;
            const { to, label } = link;
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(168,85,247,0.15))",
                        border: "1px solid rgba(34,211,238,0.2)",
                      }
                    : {}
                }
              >
                <NavIcon size={18} className="shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span
                    className="absolute left-full ml-3 px-2 py-1 rounded-lg text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                    style={{ background: "rgba(30,40,60,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User + Logout ── */}
        <div
          className="px-2 py-4 flex flex-col gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* User info */}
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}
            >
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group relative"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
            {collapsed && (
              <span
                className="absolute left-full ml-3 px-2 py-1 rounded-lg text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: "rgba(30,40,60,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Logout
              </span>
            )}
          </button>
        </div>

        {/* ── Collapse toggle (desktop only) ── */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center text-slate-400 hover:text-white transition-colors"
          style={{
            background: "rgba(30,40,60,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
