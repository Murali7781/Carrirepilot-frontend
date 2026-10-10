import { useCallback, useEffect, useRef, useState } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/coach.scss';

export default function CoachWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assistantMode, setAssistantMode] = useState('local');
  const [modeNotice, setModeNotice] = useState('');
  const [status, setStatus] = useState('idle');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const labels = { '/dashboard': 'Career overview', '/profile': 'Career profile', '/resumes': 'Resume builder', '/jobs': 'Role search', '/saved-jobs': 'Saved roles', '/applications': 'Application tracker', '/skills': 'Skills', '/interviews': 'Interview practice' };
  const context = labels[location.pathname] || (location.pathname.startsWith('/interviews/') ? 'Interview practice session' : 'Career workspace');

  const openAssistant = useCallback(() => {
    setStatus((current) => current === 'idle' ? 'checking' : current);
    setOpen(true);
  }, []);
  const closeAssistant = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [open, history, loading]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open || status !== 'checking') return;
    let active = true;
    const controller = new AbortController();
    api.get('/ai/status', { signal: controller.signal }).then((response) => {
      if (!active) return;
      const data = response.data?.data || {};
      setAssistantMode(data.mode || 'local');
      setModeNotice(data.message || '');
      setStatus('ready');
    }).catch(() => {
      if (active && !controller.signal.aborted) {
        setModeNotice('Assistant status could not be checked. You can still try sending a message.');
        setStatus('error');
      }
    });
    return () => { active = false; controller.abort(); };
  }, [open, status]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);
  useEffect(() => {
    window.addEventListener('careerpilot:open-coach', openAssistant);
    return () => window.removeEventListener('careerpilot:open-coach', openAssistant);
  }, [openAssistant]);

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
      setStatus('ready');
      setHistory((current) => [...current, { role: 'assistant', text: result.response || 'I could not create a response. Try again.' }]);
      setError('');
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
    {open ? <section className="coach-panel" id="coach-panel" role="dialog" aria-labelledby="coach-title" aria-modal="false">
      <header className="coach-header"><span className="coach-avatar" aria-hidden="true"><FiMessageCircle /></span><div><strong id="coach-title">CareerPilot assistant</strong><small>Here to help with {context.toLowerCase()}</small><span className={`coach-mode ${status === 'checking' ? 'checking' : status === 'error' ? 'error' : assistantMode}`} aria-live="polite">{status === 'checking' ? 'Checking assistant…' : status === 'error' ? 'Status unavailable' : assistantMode === 'openai' ? 'OpenAI configured' : 'Local guidance'}</span></div><button type="button" onClick={closeAssistant} aria-label="Close career assistant"><FiX /></button></header>
      <div className="coach-messages" role="log" aria-label="Career assistant conversation" aria-live="polite" aria-relevant="additions text">
        {!history.length ? <div className="coach-intro"><span className="eyebrow">YOUR CAREER GUIDE</span><h3>What are you working on?</h3><p>Ask about your resume, a role you saved, an application, skill gaps, or interview practice.</p><div className="coach-suggestions">{['Help me prepare for an interview', 'How can I improve my resume?'].map((suggestion) => <button key={suggestion} type="button" disabled={loading} onClick={() => setMessage(suggestion)}>{suggestion}</button>)}</div></div> : history.map((item, index) => <div className={`coach-message ${item.role}`} key={`${index}-${item.role}`}><span aria-hidden="true">{item.role === 'assistant' ? 'CP' : 'You'}</span><p>{item.text}</p></div>)}
        {loading ? <div className="coach-typing" role="status" aria-label="Career assistant is responding"><span /><span /><span /> Thinking</div> : null}{modeNotice ? <div className="coach-mode-notice" role="status">{modeNotice}</div> : null}{error ? <div className="coach-error" role="alert">{error}</div> : null}<div ref={bottomRef} />
      </div>
      <form className="coach-compose" onSubmit={send}><textarea ref={inputRef} aria-label="Message CareerPilot assistant" placeholder="Ask a career question…" rows={2} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={!message.trim() || loading} aria-label="Send message"><FiSend /></button></form>
      <div className="coach-footer">Your message and career workspace summary may be sent to the configured AI provider. Verify important advice.</div>
    </section> : null}
    <button ref={launcherRef} type="button" className={`coach-launcher${open ? ' open' : ''}`} onClick={open ? closeAssistant : openAssistant} aria-expanded={open} aria-controls={open ? 'coach-panel' : undefined} aria-label={open ? 'Close career assistant' : 'Open career assistant'}><FiMessageCircle /><span>{open ? 'Close' : 'Career assistant'}</span></button>
  </div>;
}
