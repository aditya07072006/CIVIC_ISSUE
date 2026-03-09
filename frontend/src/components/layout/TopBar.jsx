import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, Bell } from "lucide-react";

const PAGE_TITLES = {
  "/dashboard": "My Issues",
  "/report":    "Report Issue",
  "/admin":     "Admin Dashboard",
};

export function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "CivicPortal";

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-4 md:px-6 h-16"
      style={{
        background: "rgba(5,11,20,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Hamburger – mobile (always) + desktop (when sidebar collapsed) */}
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-slate-200">{title}</h1>
      </div>

      {/* Right side – user chip */}
      <div className="flex items-center gap-2">
        {/* Notification bell (decorative) */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Bell size={17} />
        </button>

        {/* Avatar */}
        <div
          className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: "linear-gradient(135deg,#22d3ee,#a855f7)" }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-slate-300 hidden sm:block">{user?.name}</span>
          {user?.role === "admin" && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md hidden sm:block"
              style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}
            >
              ADMIN
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
