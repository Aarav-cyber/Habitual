import { useEffect, useRef, useState } from 'react';
import { format, parse } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import HabitCard from '../components/HabitCard';
import HabitModal from '../components/HabitModal';
import CycleModal from '../components/CycleModal';
import PlannedTaskRow from '../components/PlannedTaskRow';
import toast from 'react-hot-toast';

export default function Today() {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [entries, setEntries] = useState([]);
  const [plannedTasks, setPlannedTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [cycleHabit, setCycleHabit] = useState(null);
  const [mood, setMood] = useState(null);
  const refreshTimerRef = useRef(null);

  const dateStr = format(date, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  useEffect(() => {
    const q = searchParams.get('date');
    if (!q) return;
    const parsed = parse(q, 'yyyy-MM-dd', new Date());
    if (!Number.isNaN(parsed.getTime())) setDate(parsed);
  }, [searchParams]);

  useEffect(() => {
    loadAll();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [dateStr]);

  useEffect(() => {
    // Background revalidation so repeated toggles don't refetch immediately.
    const id = setInterval(() => {
      loadAll({ silent: true });
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  const loadAll = async ({ silent } = {}) => {
    try {
      const res = await api.get('/today', { params: { date: dateStr } });
      setHabits(res.data.habits || []);
      setEntries(res.data.entries || []);
      setMood(res.data.mood?.score ?? null);
      setPlannedTasks(res.data.plannedTasks || []);
    } catch (e) {
      if (!silent) toast.error('Failed to load today');
    }
  };

  const entryFor = (habitId) => entries.find(e => e.habitId === habitId);

  const saveMood = async (score) => {
    setMood(score);
    await api.post('/mood', { score });
    toast.success('Mood logged!');
  };

  // Filter habits by schedule
  const dayOfWeek = date.getDay();
  const todayHabits = habits.filter(h =>
    h.scheduleDays.length === 0 || h.scheduleDays.includes(dayOfWeek)
  );

  const habitCompleted = todayHabits.filter(h => entryFor(h._id)?.completed).length;
  const plannedDone = plannedTasks.filter(p => p.completed).length;
  const totalItems = todayHabits.length + plannedTasks.length;
  const completedCount = habitCompleted + plannedDone;
  const pct = totalItems ? Math.round((completedCount / totalItems) * 100) : 0;

  const upsertEntry = (serverEntry) => {
    if (!serverEntry) return;
    setEntries(prev => {
      const idx = prev.findIndex(e => e._id === serverEntry._id || (e.habitId === serverEntry.habitId && e.date === serverEntry.date));
      if (idx === -1) return [...prev, serverEntry];
      const copy = prev.slice();
      copy[idx] = serverEntry;
      return copy;
    });

    // Debounced background refresh to reconcile XP/streak side effects without spamming.
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => loadAll({ silent: true }), 1200);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, system-ui', fontWeight: 800, fontSize: 28 }}>
            {isToday ? 'Today' : format(date, 'EEEE, MMM d')}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{format(date, 'MMMM d, yyyy')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link
            to="/calendar"
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 10px' }}
          >
            <CalendarDays size={16} /> Plan
          </Link>
          <button className="btn btn-ghost" style={{ padding: '7px 10px' }} onClick={() => setDate(d => new Date(d - 86400000))}><ChevronLeft size={16}/></button>
          {!isToday && <button className="btn btn-ghost" onClick={() => setDate(new Date())} style={{ fontSize: 12 }}>Today</button>}
          <button className="btn btn-ghost" style={{ padding: '7px 10px' }} onClick={() => setDate(d => new Date(+d + 86400000))} disabled={isToday}><ChevronRight size={16}/></button>
        </div>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="glass fade-up" style={{ padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{completedCount} / {totalItems} completed</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--accent)' }}>{pct}%</span>
          </div>
          <div className="prog-bar" style={{ height: 6 }}>
            <div className="prog-fill" style={{ width: `${pct}%` }}/>
          </div>
          {pct === 100 && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              🎉 Perfect day! Everything done.
            </div>
          )}
        </div>
      )}

      {/* Mood tracker */}
      {isToday && (
        <div className="glass fade-up stagger-1" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>How are you feeling today?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['😞','1'],['😐','2'],['🙂','3'],['😊','4'],['🤩','5']].map(([emoji, score]) => (
              <button key={score} onClick={() => saveMood(+score)} style={{
                width: 40, height: 40, borderRadius: 10, fontSize: 20, border: 'none',
                background: mood === +score ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'all 0.2s',
                outline: mood === +score ? '2px solid var(--accent)' : 'none',
                transform: mood === +score ? 'scale(1.15)' : 'scale(1)'
              }}>{emoji}</button>
            ))}
          </div>
        </div>
      )}

      {/* Planned tasks (from calendar) */}
      {plannedTasks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.02em' }}>
            PLANNED FOR THIS DAY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plannedTasks.map((t) => (
              <PlannedTaskRow
                key={t._id}
                task={t}
                onUpdated={(u) =>
                  setPlannedTasks((prev) => prev.map((x) => (x._id === u._id ? u : x)))
                }
                onDeleted={(id) =>
                  setPlannedTasks((prev) => prev.filter((x) => x._id !== id))
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {todayHabits.map((h, i) => (
          <div key={h._id} className={`fade-up stagger-${Math.min(i + 1, 3)}`}>
            <HabitCard
              habit={h}
              entry={entryFor(h._id)}
              date={dateStr}
              onToggle={upsertEntry}
              onEdit={() => setEditHabit(h)}
              onCycle={() => setCycleHabit(h)}
              onDelete={loadAll}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {habits.length === 0 && plannedTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Start your first habit</h3>
          <p style={{ fontSize: 14, marginBottom: 24 }}>Build consistency one day at a time — or plan tasks on the calendar.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Your First Habit</button>
          <div style={{ marginTop: 16 }}>
            <Link to="/calendar" className="btn btn-ghost" style={{ fontSize: 13 }}>
              <CalendarDays size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Open calendar
            </Link>
          </div>
        </div>
      )}

      {/* FAB */}
      {(habits.length > 0 || plannedTasks.length > 0) && (
        <button onClick={() => setShowAdd(true)} style={{
          position: 'fixed', bottom: 32, right: 32, width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6af7, #f7966a)', border: 'none', color: 'white',
          fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 24px rgba(124,106,247,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s', animation: 'pulse-glow 3s ease-in-out infinite'
        }} onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
          +
        </button>
      )}

      {showAdd && <HabitModal onClose={() => setShowAdd(false)} onSaved={loadAll}/>}
      {editHabit && <HabitModal habit={editHabit} onClose={() => setEditHabit(null)} onSaved={loadAll}/>}
      {cycleHabit && <CycleModal habit={cycleHabit} onClose={() => setCycleHabit(null)}/>}
    </div>
  );
}
