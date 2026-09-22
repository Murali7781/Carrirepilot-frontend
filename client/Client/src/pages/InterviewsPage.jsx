import { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = { type: 'technical', title: '' };

export default function InterviewsPage() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    try {
      const response = await api.get('/interviews');
      setSessions(response.data.data.interviews || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/interviews', form);
      setForm(initialForm);
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create interview session.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading interviews...</div>;
  }

  return (
    <div className="page-section">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="panel-card">
            <div className="panel-header">
              <h3>Create session</h3>
            </div>

            {error ? <div className="alert alert-danger">{error}</div> : null}

            <form onSubmit={handleCreate} className="row g-3">
              <div className="col-md-12">
                <label className="form-label">Interview type</label>
                <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="hr">HR</option>
                </select>
              </div>

              <div className="col-md-12">
                <label className="form-label">Title</label>
                <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="Frontend role interview" />
              </div>

              <div className="col-md-12">
                <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                  {saving ? 'Creating...' : 'Create interview'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="panel-card">
            <div className="panel-header">
              <h3>Interview sessions</h3>
            </div>

            {sessions.length ? (
              <div className="stack-list">
                {sessions.map((session) => (
                  <div key={session.id} className="stack-item">
                    <div>
                      <strong>{session.title || session.type}</strong>
                      <div className="text-muted small">{session.type}</div>
                    </div>
                    <span className="badge bg-primary-subtle text-primary">{session.status || 'active'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-empty">No interview sessions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
