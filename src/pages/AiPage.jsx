import { useState } from 'react';
import api from '../services/api';

export default function AiPage() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: 'user', text: message.trim() };
    setHistory((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMessage.text });
      const aiMessage = { role: 'assistant', text: response.data.data.response };
      setHistory((current) => [...current, aiMessage]);
    } catch (error) {
      setHistory((current) => [...current, { role: 'assistant', text: error.response?.data?.message || 'AI coach is unavailable right now.' }]);
    } finally {
      setMessage('');
      setLoading(false);
    }
  };

  return (
    <div className="page-section">
      <div className="panel-card ai-panel">
        <div className="panel-header">
          <h3>AI career coach</h3>
        </div>

        <div className="chat-window">
          {history.length ? (
            history.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`chat-message ${entry.role}`}>
                <div className="bubble">{entry.text}</div>
              </div>
            ))
          ) : (
            <div className="chat-empty">Ask for resume advice, skill guidance, or job-fit feedback.</div>
          )}

          {loading ? <div className="chat-message assistant"><div className="bubble">Thinking...</div></div> : null}
        </div>

        <form onSubmit={handleSubmit} className="chat-form">
          <input
            className="form-control"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask the coach for guidance..."
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
