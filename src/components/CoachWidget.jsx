import { useEffect, useRef, useState } from 'react';
import { FiMessageCircle, FiMinimize2, FiSend, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export default function CoachWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assistantMode, setAssistantMode] = useState('local');
  const [modeNotice, setModeNotice] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const labels = { '/dashboard': 'Career overview', '/profile': 'Career profile', '/resumes': 'Resume builder', '/jobs': 'Role search', '/saved-jobs': 'Saved roles', '/applications': 'Application tracker', '/skills': 'Skills', '/interviews': 'Interview practice' };
  const context = labels[location.pathname] || (location.pathname.startsWith('/interviews/') ? 'Interview practice session' : 'Career workspace');

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [open, history, loading]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    api.get('/ai/status').then((response) => {
      if (active) setAssistantMode(response.data?.data?.mode || 'local');
    }).catch(() => {
      if (active) setModeNotice('Assistant mode could not be checked.');
    });
    return () => { active = false; };
  }, [open]);
  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener('careerpilot:open-coach', openAssistant);
    return () => window.removeEventListener('careerpilot:open-coach', openAssistant);
  }, []);

  const send = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    const previousHistory = history;
    setHistory((current) => [...current, { role: 'user', text }]);
    setMessage(''); setError(''); setLoading(true);
    try {
      const response = await api.post('/ai/chat', { message: text, history: previousHistory.slice(-19), context });
      const result = response.data?.data || {};
      setAssistantMode(result.mode || 'local');
      setModeNotice(result.notice || '');
      setHistory((current) => [...current, { role: 'assistant', text: result.response || 'I could not create a response. Try again.' }]);
    } catch (err) {
      const message = err.response?.data?.message || 'The career assistant is unavailable. Try again in a moment.';
      const providerError = err.response?.data?.providerError;
      const diagnostic = providerError
        ? [providerError.status ? `HTTP ${providerError.status}` : '', providerError.type, providerError.code].filter(Boolean).join(' · ')
        : '';
      setError(diagnostic ? `${message} (${diagnostic})` : message);
    } finally { setLoading(false); }
  };

  return <div className="coach-widget">
    {open ? <section className="coach-panel" aria-label="CareerPilot assistant chat">
      <header className="coach-header"><span className="coach-avatar"><FiMessageCircle /></span><div><strong>CareerPilot assistant</strong><small>Here to help with {context.toLowerCase()}</small><span className={`coach-mode ${assistantMode}`}>{assistantMode === 'openai' ? 'AI key configured' : 'Workspace guidance'}</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Minimize career assistant"><FiMinimize2 /></button><button type="button" onClick={() => setOpen(false)} aria-label="Close career assistant"><FiX /></button></header>
      <div className="coach-messages" aria-live="polite">
        {!history.length ? <div className="coach-intro"><span className="eyebrow">YOUR CAREER GUIDE</span><h3>What are you working on?</h3><p>Ask about your resume, a role you saved, an application, skill gaps, or interview practice.</p><div className="coach-suggestions">{['Help me prepare for an interview', 'How can I improve my resume?'].map((suggestion) => <button key={suggestion} type="button" onClick={() => setMessage(suggestion)}>{suggestion}</button>)}</div></div> : history.map((item, index) => <div className={`coach-message ${item.role}`} key={`${index}-${item.role}`}><span>{item.role === 'assistant' ? 'CP' : 'You'}</span><p>{item.text}</p></div>)}
        {loading ? <div className="coach-typing" role="status"><span /><span /><span /> Thinking</div> : null}{modeNotice ? <div className="coach-mode-notice" role="status">{modeNotice}</div> : null}{error ? <div className="coach-error" role="alert">{error}</div> : null}<div ref={bottomRef} />
      </div>
      <form className="coach-compose" onSubmit={send}><textarea ref={inputRef} aria-label="Message CareerPilot assistant" placeholder="Ask a career question…" rows={2} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={!message.trim() || loading} aria-label="Send message"><FiSend /></button></form>
      <div className="coach-footer">Your message and career workspace summary may be sent to the configured AI provider. Verify important advice.</div>
    </section> : null}
    <button type="button" className={`coach-launcher${open ? ' open' : ''}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Close career assistant' : 'Open career assistant'}><FiMessageCircle /><span>{open ? 'Close' : 'Career assistant'}</span></button>
  </div>;
}
