import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Today from './pages/Today';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import Settings from './pages/Settings';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, animation: 'float 2s ease-in-out infinite' }}>🔥</div>
        <div style={{ color: 'var(--muted)', marginTop: 12 }}>Loading…</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login"/>;
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar/>
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh' }}>
        <Outlet/>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route element={<Protected/>}>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/today" element={<Today/>}/>
        <Route path="/analytics" element={<Analytics/>}/>
        <Route path="/insights" element={<Insights/>}/>
        <Route path="/settings" element={<Settings/>}/>
      </Route>
    </Routes>
  );
}
