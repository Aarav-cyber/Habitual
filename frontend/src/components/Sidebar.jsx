import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Flame, BarChart3, Brain, Settings, LogOut, Sparkles, Target } from 'lucide-react';

const NAV = [
  { to: '/today', icon: Target, label: 'Today' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/insights', icon: Brain, label: 'AI Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const xpToNext = 500 - (user?.xp % 500 || 0);
  const xpPct = ((user?.xp % 500) / 500) * 100;

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--bg2)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', padding: '24px 12px', position: 'fixed', top: 0, left: 0, zIndex: 30
    }}>
      {/* Logo */}
      <div style={{ padding: '0 4px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #7c6af7, #f7966a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔥</div>
          <span style={{ fontFamily: 'Syne, system-ui', fontWeight: 800, fontSize: 18 }}>Habitual</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon size={16}/> {label}
          </NavLink>
        ))}
      </nav>

      {/* User card */}
      {user && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {/* XP bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Level {user.level}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{xpToNext} XP to next</span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill xp-bar-fill" style={{ width: `${xpPct}%` }}/>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 12 }}>
            <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)' }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, truncate: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{user.xp} XP</div>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
              <LogOut size={14}/>
            </button>
          </div>

          {/* Badges */}
          {user.badges?.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {user.badges.slice(-4).map(b => (
                <span key={b.id} title={b.name} style={{ fontSize: 16 }}>{b.icon}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
