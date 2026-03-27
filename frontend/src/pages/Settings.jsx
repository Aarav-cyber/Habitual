import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Zap, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') toast.success('Notifications enabled! ✅');
      else toast.error('Notifications blocked');
    } else toast.error('Notifications not supported');
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'Syne, system-ui', fontWeight: 800, fontSize: 28, marginBottom: 28 }}>Settings</h1>

      {/* Profile */}
      <div className="glass" style={{ padding: '24px', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="var(--accent)"/> Profile
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={user?.avatar} alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--border)' }}/>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{user?.email}</div>
            <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-purple">Level {user?.level}</span>
              <span className="badge badge-orange">{user?.xp} XP</span>
              <span className="badge badge-green">❄️ {user?.streakFreezes} Freezes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      {user?.badges?.length > 0 && (
        <div className="glass" style={{ padding: '24px', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--gold)"/> Badges Earned
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {user.badges.map(b => (
              <div key={b.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 28 }}>{b.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="glass" style={{ padding: '24px', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="var(--accent)"/> Notifications
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Enable browser notifications to get reminded about your habits at the times you set.</p>
        <button className="btn btn-primary" onClick={requestNotifications}>Enable Notifications</button>
      </div>

      {/* About */}
      <div className="glass" style={{ padding: '24px', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>About Habitual</h3>
        <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8 }}>
          <div>Version: <strong style={{ color: 'var(--text)' }}>1.0.0</strong></div>
          <div>Stack: <strong style={{ color: 'var(--text)' }}>React + Node.js + MongoDB</strong></div>
          <div>Auth: <strong style={{ color: 'var(--text)' }}>Google OAuth 2.0</strong></div>
          <div>AI: <strong style={{ color: 'var(--text)' }}>Claude (Anthropic)</strong></div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass" style={{ padding: '24px', borderColor: 'rgba(248,113,113,0.2)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--red)' }}>Danger Zone</h3>
        <button className="btn btn-danger" onClick={handleLogout} style={{ gap: 8 }}>
          <LogOut size={14}/> Log Out
        </button>
      </div>
    </div>
  );
}
