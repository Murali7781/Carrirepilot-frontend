import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { FiSend } from 'react-icons/fi';

export default function AiPage() {
  const { user } = useAuth();
  const historyKey = `careerpilot_ai_history_${user?.id || 'guest'}`;
  const [message, setMessage] = useState('');
  const [historyState, setHistoryState] = useState({ key: '', messages: [] });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('local');
  const [coachStatus, setCoachStatus] = useState('');
  const endRef = useRef(null);
  const starterPrompts = ['Review my resume for a frontend role', 'Build me a 2-week learning plan', 'Help me prepare for a technical interview', 'How should I prioritize my applications?'];
  const history = historyState.key === historyKey ? historyState.messages : [];

  const setHistory = (updater) => {
    setHistoryState((current) => {
      const currentMessages = current.key === historyKey ? current.messages : [];
      const nextMessages = typeof updater === 'function' ? updater(currentMessages) : updater;
      return { key: historyKey, messages: nextMessages };
    });
  };

  useEffect(() => {
    let savedHistory = [];
    try {
      const saved = localStorage.getItem(historyKey);
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) savedHistory = parsed;
    } catch {
      localStorage.removeItem(historyKey);
    }
    setHistoryState({ key: historyKey, messages: savedHistory });
  }, [historyKey]);

  useEffect(() => {
    if (historyState.key !== historyKey) return;
    localStorage.setItem(historyKey, JSON.stringify(historyState.messages.slice(-40)));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historyKey, historyState]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: 'user', text: message.trim() };
    const conversation = [...history, userMessage].slice(-40);
    setHistory(conversation);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMessage.text, history: conversation });
      const result = response.data.data;
      const aiMessage = { role: 'assistant', text: result.response };
      setHistory((current) => [...current, aiMessage]);
      setMode(result.mode || 'local');
      setCoachStatus(result.status || '');
    } catch (error) {
      setHistory((current) => [...current, { role: 'assistant', text: error.response?.data?.message || 'AI coach is unavailable right now.' }]);
      setMode('local');
      setCoachStatus('Career coach is unavailable right now.');
    } finally {
      setMessage('');
      setLoading(false);
    }
  };

  return (
    <div className="page-section">
      <div className="ai-workspace">
        <aside className="ai-sidebar panel-card">
          <div className="ai-avatar">CP</div>
          <h3>CareerPilot mentor</h3>
          <p>Practical guidance for your next career move.</p>
          <span className={`coach-mode coach-mode-${mode}`}>{mode === 'openai' ? 'Live AI connected' : 'Local guidance'}</span>
          <button type="button" className="btn btn-light btn-sm" onClick={() => { setHistory([]); setCoachStatus(''); }}>New conversation</button>
          <div className="ai-trust-note">{coachStatus || 'Local guidance uses your saved career details and preset advice. When live AI is configured, your prompt and selected career context are sent securely from the server to OpenAI.'}</div>
        </aside>
        <div className="panel-card ai-panel">
        <div className="panel-header">
          <div><h3>Career coach</h3><p className="text-muted mb-0">Practical suggestions grounded in your workspace.</p></div>
        </div>

        <div className="chat-window">
          {!history.length ? <div className="ai-welcome"><strong>What would you like to work on?</strong><div className="ai-prompt-grid">{starterPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => setMessage(prompt)}>{prompt}</button>)}</div></div> : null}
          {history.length ? (
            history.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`chat-message ${entry.role}`}>
                <span className="chat-speaker">{entry.role === 'assistant' ? 'CareerPilot' : 'You'}</span>
                <div className="bubble">{entry.text}</div>
              </div>
            ))
          ) : null}

          {loading ? <div className="chat-message assistant" aria-live="polite"><span className="chat-speaker">CareerPilot</span><div className="bubble">Thinking…</div></div> : null}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            className="form-control"
            value={message}
            maxLength={4000}
            rows={2}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }}
            onChange={(event) => setMessage(event.target.value)}
            aria-label="Message the career coach"
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()} aria-label="Send message">
            <FiSend /> Send
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
