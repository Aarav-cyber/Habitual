import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['health', 'learning', 'fitness', 'mindfulness', 'productivity', 'social', 'creative', 'finance'];
const COLORS = ['#7c6af7','#f7966a','#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399'];
const ICONS = ['💪','📚','🏃','🧘','🎯','✍️','💻','🎵','🌿','💰','🍎','💤','🚀','🌅','⚡'];

export default function HabitModal({ habit, onClose, onSaved }) {
  const editing = !!habit;
  const [form, setForm] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    category: habit?.category || 'health',
    type: habit?.type || 'boolean',
    targetValue: habit?.targetValue || 1,
    unit: habit?.unit || '',
    color: habit?.color || '#7c6af7',
    icon: habit?.icon || '✨',
    scheduleDays: habit?.scheduleDays || [],
    reminderTime: habit?.reminderTime || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDay = (d) => {
    set('scheduleDays', form.scheduleDays.includes(d)
      ? form.scheduleDays.filter(x => x !== d)
      : [...form.scheduleDays, d]);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name required');
    try {
      if (editing) await api.patch(`/habits/${habit._id}`, form);
      else await api.post('/habits', form);
      toast.success(editing ? 'Habit updated' : 'Habit created! 🎉');
      onSaved();
      onClose();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px 8px' }}><X size={16}/></button>
        </div>

        {/* Icon + Color row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 220 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => set('icon', ic)} style={{
                  width: 36, height: 36, borderRadius: 8, fontSize: 18, border: 'none',
                  background: form.icon === ic ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  outline: form.icon === ic ? '2px solid var(--accent)' : 'none'
                }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{
                  width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                  outline: form.color === c ? `3px solid ${c}` : '2px solid transparent',
                  outlineOffset: 2, transition: 'outline 0.15s'
                }}/>
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Habit Name *</label>
          <input className="inp" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Morning workout"/>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Description</label>
          <textarea className="inp" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Why does this habit matter to you?" rows={2} style={{ resize: 'none' }}/>
        </div>

        {/* Category + Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Category</label>
            <select className="inp" value={form.category} onChange={e => set('category', e.target.value)} style={{ cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Type</label>
            <select className="inp" value={form.type} onChange={e => set('type', e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="boolean">✅ Yes / No</option>
              <option value="count">🔢 Count</option>
              <option value="time">⏱ Time-based</option>
            </select>
          </div>
        </div>

        {/* Target (for count/time) */}
        {form.type !== 'boolean' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Target</label>
              <input className="inp" type="number" value={form.targetValue} onChange={e => set('targetValue', +e.target.value)} min={1}/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Unit</label>
              <input className="inp" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder={form.type === 'time' ? 'minutes' : 'reps'}/>
            </div>
          </div>
        )}

        {/* Schedule */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Schedule (empty = every day)</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)} style={{
                width: 36, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                background: form.scheduleDays.includes(i) ? 'var(--accent)' : 'rgba(255,255,255,0.04)',
                borderColor: form.scheduleDays.includes(i) ? 'var(--accent)' : 'var(--border)',
                color: form.scheduleDays.includes(i) ? 'white' : 'var(--muted)'
              }}>{d}</button>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Reminder Time</label>
          <input className="inp" type="time" value={form.reminderTime} onChange={e => set('reminderTime', e.target.value)} style={{ width: 160 }}/>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>
            {editing ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
