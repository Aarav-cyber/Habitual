import { Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function PlannedTaskRow({ task, onUpdated, onDeleted }) {
  const toggle = async () => {
    try {
      const { data } = await api.patch(`/planned-tasks/${task._id}`, {
        completed: !task.completed
      });
      onUpdated?.(data);
    } catch {
      toast.error('Could not update task');
    }
  };

  const del = async () => {
    if (!confirm(`Remove "${task.title}"?`)) return;
    try {
      await api.delete(`/planned-tasks/${task._id}`);
      onDeleted?.(task._id);
      toast.success('Removed');
    } catch {
      toast.error('Could not delete');
    }
  };

  return (
    <div
      className="glass glass-hover"
      style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: `3px solid ${task.completed ? task.color || 'var(--accent)' : 'transparent'}`,
        opacity: task.completed ? 0.85 : 1
      }}
    >
      <button
        type="button"
        className={`habit-check ${task.completed ? 'done' : 'empty'}`}
        onClick={toggle}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        style={{
          background: task.completed ? task.color || 'var(--accent)' : undefined,
          borderColor: task.completed ? 'transparent' : 'rgba(255,255,255,0.12)',
          flexShrink: 0
        }}
      >
        {task.completed ? '✓' : '✓'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'var(--muted)' : 'var(--text)'
          }}
        >
          {task.title}
        </div>
        {task.note && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {task.note}
          </div>
        )}
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ padding: 6, opacity: 0.5 }}
        onClick={del}
        aria-label="Delete planned task"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
