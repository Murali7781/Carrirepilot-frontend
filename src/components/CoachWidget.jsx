import { useEffect, useMemo, useRef, useState } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

const greeting = { role: 'assistant', text: 'Hi! I can help with resumes, applications, skills, and interview preparation. What are you working on?' };

export default function CoachWidget() {
  const { user } = useAuth();
  const historyKey = `careerpilot_ai_history_${user?.id || 'guest'}`;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [storedHistory, setStoredHistory] = useState({ key: '', messages: [] });
  const messages = useMemo(() => storedHistory.key === historyKey ? storedHistory.messages : [greeting], [historyKey, storedHistory]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('local');
  const endRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(historyKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setStoredHistory({ key: historyKey, messages: Array.isArray(parsed) && parsed.length ? parsed : [greeting] });
    } catch {
      setStoredHistory({ key: historyKey, messages: [greeting] });
    }
  }, [historyKey]);

  useEffect(() => {
    if (storedHistory.key !== historyKey) return;
    localStorage.setItem(historyKey, JSON.stringify(storedHistory.messages.slice(-40)));
  }, [historyKey, storedHistory]);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, open]);

  const send = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user', text }];
    setStoredHistory({ key: historyKey, messages: next }); setMessage(''); setLoading(true);
    try {
      const response = await api.post('/ai/chat', { message: text, history: next.slice(-12) });
      setStoredHistory((current) => ({ key: historyKey, messages: [...(current.key === historyKey ? current.messages : []), { role: 'assistant', text: response.data.data.response }] }));
      setMode(response.data.data.mode || 'local');
    } catch (error) {
      setStoredHistory((current) => ({ key: historyKey, messages: [...(current.key === historyKey ? current.messages : []), { role: 'assistant', text: error.response?.data?.message || 'I could not reach the career coach. Please try again.' }] }));
      setMode('local');
    } finally { setLoading(false); }
  };

  return <div className="coach-widget">
    {open ? <section className="coach-widget-panel" aria-label="CareerPilot career assistant">
      <header><div><span className="coach-widget-mark">C</span><div><strong>CareerPilot assistant</strong><small>{mode === 'openai' ? 'Live AI connected' : 'Local career guidance'}</small></div></div><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}><FiX /></button></header>
      <div className="coach-widget-messages" aria-live="polite">{messages.map((item, index) => <div key={`${item.role}-${index}`} className={`coach-widget-message ${item.role}`}>{item.text}</div>)}{loading ? <div className="coach-widget-message assistant">Thinking…</div> : null}<div ref={endRef} /></div>
      <form onSubmit={send}><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} aria-label="Ask CareerPilot" /><button type="submit" aria-label="Send message" disabled={!message.trim() || loading}><FiSend /></button></form>
    </section> : null}
    <button className="coach-widget-launcher" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-label={open ? 'Close career assistant' : 'Open career assistant'}>{open ? <FiX /> : <FiMessageCircle />}<span>{open ? 'Close' : 'Ask CareerPilot'}</span></button>
  </div>;
}
