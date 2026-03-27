import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Flame, Trophy, Zap, BarChart2, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import HabitModal from '../components/HabitModal';
import CycleModal from '../components/CycleModal';

const StatCard = ({ icon, label, value, sub, color = 'var(--accent)' }) => (
  <div className="glass" style={{ padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [cycleHabit, setCycleHabit] = useState(null);
  const [heatmap, setHeatmap] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [ov, hm] = await Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/heatmap', { params: { year: new Date().getFullYear() } })
    ]);
    setOverview(ov.data);
    setHeatmap(hm.data);

    // Build 30-day chart
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      days.push({ date: format(subDays(new Date(), i), 'MMM d'), count: hm.data[d] || 0 });
    }
    setChartData(days);
  };

  const totalStreak = overview?.habits.reduce((acc, h) => acc + h.streak, 0) || 0;
  const totalCompleted = overview?.habits.reduce((acc, h) => acc + h.completedLast30, 0) || 0;

  // Build heatmap for current year
  const heatmapCells = () => {
    const cells = [];
    const today = new Date();
    const startYear = new Date(today.getFullYear(), 0, 1);
    const totalDays = Math.ceil((today - startYear) / 86400000) + 1;
    for (let i = 0; i < Math.min(totalDays, 365); i++) {
      const d = new Date(startYear.getTime() + i * 86400000);
      const key = format(d, 'yyyy-MM-dd');
      const count = heatmap[key] || 0;
      let bg = 'rgba(255,255,255,0.04)';
      if (count >= 1) bg = 'rgba(124,106,247,0.25)';
      if (count >= 2) bg = 'rgba(124,106,247,0.5)';
      if (count >= 3) bg = 'rgba(124,106,247,0.75)';
      if (count >= 5) bg = '#7c6af7';
      cells.push({ key, bg, count, label: `${key}: ${count} completions` });
    }
    return cells;
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, system-ui', fontWeight: 800, fontSize: 30 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16}/> New Habit
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard icon="🔥" label="Total Streak Days" value={totalStreak} sub="across all habits" color="var(--accent2)"/>
        <StatCard icon="✅" label="Done (30 days)" value={totalCompleted} sub="habit completions" color="var(--green)"/>
        <StatCard icon="⚡" label="XP Earned" value={user?.xp || 0} sub={`Level ${user?.level || 1}`} color="var(--gold)"/>
        <StatCard icon="🏅" label="Badges" value={user?.badges?.length || 0} sub={user?.badges?.[user?.badges?.length-1]?.name || 'None yet'} color="var(--accent)"/>
      </div>

      {/* Chart + Habits list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        {/* Activity chart */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>30-Day Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false} interval={6}/>
              <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}/>
              <Area type="monotone" dataKey="count" stroke="#7c6af7" strokeWidth={2} fill="url(#areaGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Habits with streaks */}
        <div className="glass" style={{ padding: '20px', overflowY: 'auto', maxHeight: 260 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Habit Streaks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overview?.habits.map(({ habit, streak, completedLast30 }) => (
              <div key={habit._id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                onClick={() => setCycleHabit(habit)}>
                <span style={{ fontSize: 20 }}>{habit.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{habit.name}</div>
                  <div className="prog-bar" style={{ marginTop: 4 }}>
                    <div className="prog-fill" style={{ width: `${Math.min(100, (completedLast30 / 30) * 100)}%`, background: habit.color }}/>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 700, color: streak > 0 ? 'var(--accent2)' : 'var(--muted)', flexShrink: 0 }}>
                  🔥 {streak}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass" style={{ padding: '20px', marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Habit Heatmap — {new Date().getFullYear()}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {heatmapCells().map(cell => (
            <div key={cell.key} className="heatmap-cell" title={cell.label}
              style={{ width: 14, height: 14, background: cell.bg, borderRadius: 3 }}/>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Less</span>
          {['rgba(255,255,255,0.04)','rgba(124,106,247,0.25)','rgba(124,106,247,0.5)','rgba(124,106,247,0.75)','#7c6af7'].map((c,i) => (
            <div key={i} style={{ width: 12, height: 12, background: c, borderRadius: 2 }}/>
          ))}
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>More</span>
        </div>
      </div>

      {/* Cycle history per habit */}
      {overview?.habits.filter(h => h.cycleHistory.length > 0).map(({ habit, cycleHistory }) => (
        <div key={habit._id} className="glass" style={{ padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontWeight: 700 }}>{habit.icon} {habit.name} — Cycle History</h4>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setCycleHabit(habit)}>View All</button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {cycleHistory.slice(0, 5).map(c => {
              const pct = Math.round((c.consistencyScore || 0) * 100);
              const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent2)' : 'var(--red)';
              return (
                <div key={c._id} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{pct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showAdd && <HabitModal onClose={() => setShowAdd(false)} onSaved={loadData}/>}
      {cycleHabit && <CycleModal habit={cycleHabit} onClose={() => setCycleHabit(null)}/>}
    </div>
  );
}
