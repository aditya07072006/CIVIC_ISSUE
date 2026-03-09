import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useLocation } from "react-router-dom";

export function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const sidebarWidth = collapsed ? 72 : 240;

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#050b14" }}>
      {/* ── Sidebar (fixed) ── */}
      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      {/* Responsive margin: sidebar width on desktop, 0 on mobile */}
      <style>{`
        .app-shell { margin-left: 0; transition: margin-left 0.3s ease; }
        @media(min-width:768px){ .app-shell { margin-left: ${sidebarWidth}px; } }
      `}</style>

      <div className="app-shell flex flex-col min-h-screen">
        <TopBar onMenuClick={handleMenuClick} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
