import { useState, useEffect } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import api from '../utils/api';

const TOOLTIP_STYLE = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 12 };

export default function Analytics() {
  const [insights, setInsights] = useState(null);
  const [overview, setOverview] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ins, ov, ents] = await Promise.all([
        api.get('/analytics/insights'),
        api.get('/analytics/overview'),
        api.get('/entries', { params: { from: format(subDays(new Date(), 89), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') } })
      ]);
      setInsights(ins.data);
      setOverview(ov.data);
      setAllEntries(ents.data);
    } finally { setLoading(false); }
  };

  // Per-habit weekly completion
  const habitWeeklyData = () => {
    if (!overview) return [];
    return overview.habits.map(({ habit }) => {
      const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
      const count = last7.filter(d => {
        const key = format(d, 'yyyy-MM-dd');
        return allEntries.some(e => e.habitId === habit._id && format(new Date(e.date), 'yyyy-MM-dd') === key && e.completed);
      }).length;
      return { name: habit.icon + ' ' + habit.name.slice(0, 12), done: count, max: 7 };
    });
  };

  // Mood vs habits correlation
  const moodCorrelation = () => {
    if (!insights?.mood?.length) return [];
    return insights.mood.slice(-14).map(m => {
      const day = format(new Date(m.date), 'yyyy-MM-dd');
      const completions = allEntries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === day && e.completed).length;
      return { date: format(new Date(m.date), 'MMM d'), mood: m.score, habits: completions };
    });
  };

  // Category radar
  const categoryRadar = () => {
    if (!overview) return [];
    const catMap = {};
    overview.habits.forEach(({ habit, completedLast30 }) => {
      if (!catMap[habit.category]) catMap[habit.category] = 0;
      catMap[habit.category] += completedLast30;
    });
    return Object.entries(catMap).map(([cat, val]) => ({ subject: cat, value: val }));
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading analytics…</div>;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000 }}>
      <h1 style={{ fontFamily: 'Syne, system-ui', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Analytics</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>Deep dive into your habit performance.</p>

      {/* Weekly insight */}
      {insights?.bestDay && (
        <div className="glass fade-up" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Best Day</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{insights.bestDay}</div>
          </div>
          {insights.weeklyConsistency?.map(w => (
            <div key={w.week}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{w.week}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{w.count}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Habit weekly bar chart */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>This Week by Habit</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={habitWeeklyData()} layout="vertical">
              <XAxis type="number" domain={[0, 7]} tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false}/>
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text)', fontSize: 11 }} tickLine={false} axisLine={false} width={110}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Bar dataKey="done" fill="#7c6af7" radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category radar */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Category Balance (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={categoryRadar()}>
              <PolarGrid stroke="rgba(255,255,255,0.08)"/>
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 11 }}/>
              <Radar name="Completions" dataKey="value" stroke="#7c6af7" fill="#7c6af7" fillOpacity={0.25}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mood vs Habits */}
      {moodCorrelation().length > 0 && (
        <div className="glass" style={{ padding: '20px', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>Mood vs Habit Completion</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>See if your mood correlates with completing habits.</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={moodCorrelation()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false}/>
              <YAxis yAxisId="mood" domain={[1,5]} tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false}/>
              <YAxis yAxisId="habits" orientation="right" tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE}/>
              <Legend wrapperStyle={{ fontSize: 12 }}/>
              <Line yAxisId="mood" type="monotone" dataKey="mood" stroke="#f7966a" strokeWidth={2} dot={false} name="Mood (1-5)"/>
              <Line yAxisId="habits" type="monotone" dataKey="habits" stroke="#7c6af7" strokeWidth={2} dot={false} name="Habits Done"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-habit consistency table */}
      <div className="glass" style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Consistency Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {overview?.habits.map(({ habit, completedLast30, streak, cycleHistory }) => {
            const latestCycle = cycleHistory[0];
            const pct = Math.round((completedLast30 / 30) * 100);
            const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--accent2)' : 'var(--red)';
            return (
              <div key={habit._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                <span style={{ fontSize: 22 }}>{habit.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{habit.name}</div>
                  <div className="prog-bar" style={{ marginTop: 5 }}>
                    <div className="prog-fill" style={{ width: `${pct}%`, background: habit.color || 'var(--accent)' }}/>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>30-day</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent2)' }}>🔥{streak}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>streak</div>
                  </div>
                  {latestCycle && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{Math.round((latestCycle.consistencyScore || 0) * 100)}%</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>last cycle</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
