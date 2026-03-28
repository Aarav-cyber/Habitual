import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Today from "./pages/Today";
import Analytics from "./pages/Analytics";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";

function Protected() {
  const { user, loading } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = () => {
      if (window.innerWidth >= 900) setNavOpen(false);
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);
  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: 40, animation: "float 2s ease-in-out infinite" }}
          >
            🔥
          </div>
          <div style={{ color: "var(--muted)", marginTop: 12 }}>Loading…</div>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="app-shell">
      <Sidebar mobileOpen={navOpen} onClose={closeNav} />
      {navOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}
      <main className="app-main">
        <header className="mobile-topbar">
          <button
            className="mobile-toggle"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <span>Habitual</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/today" element={<Today />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
