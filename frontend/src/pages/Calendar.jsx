import { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday as isDateToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PlannedTaskRow from '../components/PlannedTaskRow';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalDate, setModalDate] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');

  const range = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return { start, end };
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const from = format(range.start, 'yyyy-MM-dd');
        const to = format(range.end, 'yyyy-MM-dd');
        const { data } = await api.get('/planned-tasks', { params: { from, to } });
        if (!cancelled) setTasks(data || []);
      } catch {
        if (!cancelled) toast.error('Failed to load calendar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range.start, range.end]);

  const tasksByDay = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const key = format(new Date(t.scheduledDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const leadingBlanks = startOfMonth(month).getDay();

  const openDay = (d) => {
    setModalDate(d);
    setNewTitle('');
    setNewNote('');
  };

  const addTask = async () => {
    if (!modalDate || !newTitle.trim()) return;
    try {
      const { data } = await api.post('/planned-tasks', {
        title: newTitle.trim(),
        note: newNote.trim() || undefined,
        scheduledDate: format(modalDate, 'yyyy-MM-dd')
      });
      setTasks((prev) => [...prev, data]);
      setNewTitle('');
      setNewNote('');
      toast.success('Task scheduled');
    } catch {
      toast.error('Could not add task');
    }
  };

  const modalKey = modalDate ? format(modalDate, 'yyyy-MM-dd') : null;
  const modalTasks = modalKey ? tasksByDay[modalKey] || [] : [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Syne, system-ui',
              fontWeight: 800,
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <CalendarDays size={28} className="grad-text" style={{ opacity: 0.9 }} />
            <span className="grad-text">Plan</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Schedule one-off tasks on a day. They appear on Today when that day arrives.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '7px 10px' }}
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: 700, minWidth: 160, textAlign: 'center' }}>
            {format(month, 'MMMM yyyy')}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '7px 10px' }}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="glass fade-up" style={{ padding: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
            marginBottom: 8
          }}
        >
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--muted)',
                textAlign: 'center',
                padding: '4px 0'
              }}
            >
              {w}
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6
          }}
        >
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`b-${i}`} />
          ))}
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            const dayTasks = tasksByDay[key] || [];
            const inMonth = isSameMonth(d, month);
            return (
              <button
                key={key}
                type="button"
                onClick={() => openDay(d)}
                style={{
                  aspectRatio: '1',
                  minHeight: 72,
                  borderRadius: 10,
                  border: isDateToday(d)
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border)',
                  background: inMonth ? 'rgba(255,255,255,0.03)' : 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 8,
                  gap: 4,
                  transition: 'background 0.15s'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{format(d, 'd')}</span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background:
                      dayTasks.length > 0 ? 'var(--accent)' : 'transparent',
                    opacity: dayTasks.length ? 1 : 0
                  }}
                />
                {dayTasks.length > 1 && (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {dayTasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {loading && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
            Loading…
          </div>
        )}
      </div>

      {modalDate && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
          onClick={() => setModalDate(null)}
        >
          <div
            className="glass"
            style={{
              maxWidth: 420,
              width: '100%',
              padding: 24,
              borderRadius: 16,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>
              {format(modalDate, 'EEEE, MMM d')}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              <Link
                to={`/today?date=${modalKey}`}
                style={{ color: 'var(--accent)' }}
                onClick={() => setModalDate(null)}
              >
                Open in Today
              </Link>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {modalTasks.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  No tasks yet for this day.
                </div>
              )}
              {modalTasks.map((t) => (
                <PlannedTaskRow
                  key={t._id}
                  task={t}
                  onUpdated={(u) =>
                    setTasks((prev) => prev.map((x) => (x._id === u._id ? u : x)))
                  }
                  onDeleted={(id) =>
                    setTasks((prev) => prev.filter((x) => x._id !== id))
                  }
                />
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Add task</div>
            <input
              className="inp"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <input
              className="inp"
              placeholder="Note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              style={{ width: '100%', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalDate(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={addTask} disabled={!newTitle.trim()}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
