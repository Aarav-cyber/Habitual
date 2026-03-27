import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Zap, Edit2, Trash2, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function HabitCard({ habit, entry, date, onToggle, onEdit, onCycle, onDelete }) {
  const [menu, setMenu] = useState(false);
  const [inputVal, setInputVal] = useState(entry?.value || '');
  const lastSyncedRef = useRef(entry?.value ?? '');
  const done = entry?.completed;
  const frozen = entry?.streakFreezeUsed;

  useEffect(() => {
    const v = entry?.value ?? '';
    setInputVal(v);
    lastSyncedRef.current = v;
  }, [entry?._id, entry?.value]);

  const toggle = async () => {
    try {
      const res = await api.post('/entries/toggle', { habitId: habit._id, date, value: inputVal || undefined });
      lastSyncedRef.current = inputVal ?? '';
      onToggle?.(res.data);
    } catch (e) { toast.error(e.response?.data?.error || 'Error'); }
  };

  const freeze = async () => {
    try {
      const res = await api.post('/entries/freeze', { habitId: habit._id, date });
      toast.success('Streak freeze used ❄️');
      onToggle?.(res.data);
    } catch (e) { toast.error(e.response?.data?.error || 'No freezes left'); }
  };

  const del = async () => {
    if (!confirm(`Delete "${habit.name}"?`)) return;
    await api.delete(`/habits/${habit._id}`);
    toast.success('Habit deleted');
    onDelete();
  };

  const pct = habit.type !== 'boolean' && habit.targetValue
    ? Math.min(100, ((+inputVal || 0) / habit.targetValue) * 100) : done ? 100 : 0;

  return (
    <div className="glass glass-hover" style={{
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 0.2s', position: 'relative',
      borderLeft: `3px solid ${done ? habit.color || 'var(--accent)' : 'transparent'}`,
      opacity: done ? 1 : 0.9
    }}>
      {/* Check button */}
      <button className={`habit-check ${done ? 'done' : 'empty'}`}
        onClick={toggle}
        style={{ background: done ? habit.color || 'var(--accent)' : undefined, borderColor: done ? 'transparent' : 'rgba(255,255,255,0.12)', flexShrink: 0 }}>
        {done ? (frozen ? '❄️' : '✓') : '✓'}
      </button>

      {/* Icon + info */}
      <div style={{ fontSize: 22, flexShrink: 0 }}>{habit.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: done ? 'var(--muted)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
            {habit.name}
          </span>
          {habit.category && (
            <span className="badge badge-purple" style={{ fontSize: 10, padding: '1px 7px' }}>{habit.category}</span>
          )}
        </div>

        {/* Count / time input */}
        {habit.type !== 'boolean' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <input
              type="number" min={0} value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={() => {
                // Avoid duplicate POSTs: only sync on blur when value actually changed.
                if (!done) return;
                if ((inputVal ?? '') === (lastSyncedRef.current ?? '')) return;
                toggle();
              }}
              placeholder="0"
              style={{ width: 64, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>/ {habit.targetValue} {habit.unit}</span>
            <div className="prog-bar" style={{ flex: 1 }}>
              <div className="prog-fill" style={{ width: `${pct}%`, background: habit.color }}/>
            </div>
          </div>
        )}

        {/* Description */}
        {habit.description && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {habit.description}
          </div>
        )}
      </div>

      {/* Menu */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setMenu(m => !m)} className="btn btn-ghost" style={{ padding: '5px 7px', opacity: 0.5 }}>
          <MoreHorizontal size={15}/>
        </button>
        {menu && (
          <div onClick={() => setMenu(false)} style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg2)',
            border: '1px solid var(--border)', borderRadius: 12, padding: '6px', zIndex: 20,
            minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <button onClick={onEdit} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, fontSize: 13 }}><Edit2 size={13}/> Edit</button>
            <button onClick={onCycle} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, fontSize: 13 }}><RefreshCw size={13}/> Cycles</button>
            <button onClick={freeze} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, fontSize: 13 }}>❄️ Freeze Streak</button>
            <button onClick={del} className="btn btn-danger" style={{ width: '100%', justifyContent: 'flex-start', gap: 8, fontSize: 13 }}><Trash2 size={13}/> Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
