import { useState, useEffect, useRef } from 'react';
import { Brain, Send, Sparkles, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Insights() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, ov] = await Promise.all([
        api.get('/ai/suggestions'),
        api.get('/analytics/overview')
      ]);
      setSuggestions(s.data);
      setOverview(ov.data);
    } finally { setLoading(false); }
  };

  const buildContext = () => {
    if (!overview) return '';
    const habitSummary = overview.habits.map(({ habit, completedLast30, streak }) =>
      `- ${habit.name} (${habit.category}): ${completedLast30}/30 days, streak ${streak}, type: ${habit.type}`
    ).join('\n');
    return `User: ${user?.name}. Their active habits:\n${habitSummary}\nUser XP: ${user?.xp}, Level: ${user?.level}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = input.trim();
    setInput('');
    setChat(c => [...c, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const context = buildContext();
      const messages = [
        ...chat.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: userMsg }
      ];

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ messages, context })
      });

      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setChat(c => [...c, { role: 'assistant', text: data.reply }]);
    } catch {
      setChat(c => [...c, { role: 'assistant', text: "I'm having trouble connecting right now. Check your API key in the backend .env file." }]);
    } finally { setChatLoading(false); }
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
      {/* Left column */}
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne, system-ui', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
            <span className="grad-text">AI Insights</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Smart analysis of your habit patterns and failure predictions.</p>
        </div>

        {/* Suggestions */}
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: 20 }}>Analysing your patterns…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {suggestions.length === 0 && (
              <div className="glass" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                <Brain size={32} style={{ marginBottom: 8, opacity: 0.4 }}/>
                <div>Keep tracking for 3+ days to unlock AI insights.</div>
              </div>
            )}
            {suggestions.map((s, i) => (
              <div key={i} className={`glass fade-up stagger-${i+1}`} style={{ padding: '16px 18px', borderLeft: `3px solid ${s.type === 'warning' ? 'var(--red)' : 'var(--green)'}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 2 }}>
                    {s.type === 'warning' ? <AlertTriangle size={16} color="var(--red)"/> : <CheckCircle size={16} color="var(--green)"/>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.habitName}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{s.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--gold)"/> Quick Science-Backed Tips
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['🕐', 'Habit stacking', 'Anchor new habits to existing ones. "After I pour my morning coffee, I will meditate for 2 minutes."'],
              ['📉', 'Failure prediction', 'Habits with < 40% consistency typically fail within 2 weeks without intervention. Add accountability.'],
              ['🎯', '2-day rule', 'Never miss twice in a row. Missing once is human, missing twice is the start of a new (bad) habit.'],
              ['🧠', 'Cue-routine-reward', 'Every habit follows a loop: identify your cue, refine the routine, reward completion.'],
            ].map(([icon, title, text]) => (
              <div key={title} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: 600, position: 'sticky', top: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}/>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Habit Coach AI</span>
          </div>
          <button onClick={() => setChat([])} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}>
            <RefreshCw size={12}/> Clear
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chat.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)' }}>
              <Brain size={28} style={{ marginBottom: 8, opacity: 0.4 }}/>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>Ask me about your habits, patterns, or how to build consistency.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {["Why am I failing my habits?", "Suggest a morning routine", "How can I build streak consistency?"].map(q => (
                  <button key={q} onClick={() => setInput(q)} style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 8, color: 'var(--accent)', fontSize: 12, padding: '6px 10px', cursor: 'pointer', textAlign: 'left' }}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                fontSize: 13, lineHeight: 1.55, color: 'var(--text)'
              }}>{m.text}</div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 14, width: 56 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', animation: `bounce 1.2s ${i * 0.2}s infinite` }}/>
              ))}
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>

        {/* Input */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input className="inp" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your habit coach…" style={{ flex: 1, fontSize: 13 }}/>
          <button className="btn btn-primary" onClick={sendMessage} disabled={chatLoading} style={{ padding: '10px 12px' }}>
            <Send size={14}/>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
