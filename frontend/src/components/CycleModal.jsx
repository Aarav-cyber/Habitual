import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CycleModal({ habit, onClose }) {
  const [cycles, setCycles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newCycle, setNewCycle] = useState({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', label: '' });

  useEffect(() => { loadCycles(); }, []);

  const loadCycles = async () => {
    const { data } = await api.get(`/cycles/${habit._id}`);
    setCycles(data);
  };

  const create = async () => {
    if (!newCycle.endDate) return toast.error('End date required');
    try {
      await api.post(`/cycles/${habit._id}/new`, newCycle);
      toast.success('New cycle started!');
      setCreating(false);
      loadCycles();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const consistencyColor = (s) => {
    if (s >= 0.8) return 'var(--green)';
    if (s >= 0.5) return 'var(--accent2)';
    return 'var(--red)';
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {habit.icon} {habit.name} — Cycles
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Monthly tracking history</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px 8px' }}><X size={16}/></button>
        </div>

        {/* Active cycle */}
        {cycles.filter(c => c.isActive).map(c => (
          <div key={c._id} className="glass" style={{ padding: '14px 16px', marginBottom: 16, borderColor: 'rgba(124,106,247,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-purple">Active</span>
                  <span style={{ fontWeight: 600 }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  {format(new Date(c.startDate), 'MMM d')} → {format(new Date(c.endDate), 'MMM d, yyyy')}
                  {' · '}{differenceInDays(new Date(c.endDate), new Date())} days left
                </div>
              </div>
              <div style={{ fontSize: 24 }}>🔄</div>
            </div>
          </div>
        ))}

        {/* History */}
        {cycles.filter(c => !c.isActive).length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cycles.filter(c => !c.isActive).map(c => (
                <div key={c._id} className="glass" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {c.completedDays}/{c.totalDays} days completed
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: consistencyColor(c.consistencyScore || 0) }}>
                      {Math.round((c.consistencyScore || 0) * 100)}%
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>consistency</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New cycle form */}
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          {!creating ? (
            <button className="btn btn-primary" onClick={() => setCreating(true)} style={{ width: '100%', justifyContent: 'center' }}>
              + Start New Cycle
            </button>
          ) : (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New Cycle</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input className="inp" type="date" value={newCycle.startDate} onChange={e => setNewCycle(n => ({ ...n, startDate: e.target.value }))}/>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>End Date</label>
                  <input className="inp" type="date" value={newCycle.endDate} onChange={e => setNewCycle(n => ({ ...n, endDate: e.target.value }))}/>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Label (optional)</label>
                <input className="inp" value={newCycle.label} onChange={e => setNewCycle(n => ({ ...n, label: e.target.value }))} placeholder="e.g. April 2026"/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={create}>Start Cycle</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
