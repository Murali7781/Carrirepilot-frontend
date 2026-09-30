import { useEffect, useState } from 'react';
import { FiCalendar, FiMessageCircle, FiPlus, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';

const initialForm = { type: 'technical', title: '', scheduled_at: '' };
const questionBank = {
  technical: ['Walk me through how you would design a reliable solution for a difficult technical problem.', 'Tell me about a bug or production issue you diagnosed. How did you find the root cause?', 'How do you decide what to test when delivering a feature?'],
  behavioral: ['Tell me about a time you had to work through disagreement with a teammate.', 'Describe a project where priorities changed. How did you adapt?', 'What is a piece of feedback that changed how you work?'],
  hr: ['What kind of work are you looking for in your next role?', 'What is a strength you would bring to this team? Give a concrete example.', 'What questions would help you decide whether this role is right for you?'],
};

export default function InterviewsPage() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [activeSession, setActiveSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSessions = async () => {
    const response = await api.get('/interviews');
    setSessions(response.data.data.interviews || []);
  };

  useEffect(() => {
    let active = true;
    api.get('/interviews').then((response) => {
      if (active) setSessions(response.data.data.interviews || []);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'Unable to load interview practice.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await api.post('/interviews', form);
      const session = response.data.data.interview;
      setForm(initialForm);
      await loadSessions();
      await openSession(session.id);
      setNotice('Practice session created. Add questions when you are ready.');
    } catch (err) { setError(err.response?.data?.message || 'Unable to create practice session.'); }
    finally { setSaving(false); }
  };

  const openSession = async (id) => {
    setWorking('open'); setError('');
    try {
      const response = await api.get(`/interviews/${id}`);
      const session = response.data.data.interview;
      setActiveSession(session);
      setAnswers(Object.fromEntries((session.answers || []).map((item) => [item.question_id, item.answer_text || ''])));
      setFeedback({});
    } catch (err) { setError(err.response?.data?.message || 'Unable to open this practice session.'); }
    finally { setWorking(''); }
  };

  const addQuestionSet = async () => {
    if (!activeSession) return;
    setWorking('questions'); setError(''); setNotice('');
    try {
      const questions = questionBank[activeSession.type] || questionBank.behavioral;
      for (const question of questions) await api.post(`/interviews/${activeSession.id}/questions`, { question_text: question, question_type: activeSession.type });
      await openSession(activeSession.id);
      setNotice('Practice questions added. Write an answer and save it for your next review.');
    } catch (err) { setError(err.response?.data?.message || 'Unable to add practice questions.'); }
    finally { setWorking(''); }
  };

  const saveAnswer = async (question) => {
    const answer = (answers[question.id] || '').trim();
    if (!answer) { setError('Write an answer before saving it.'); return; }
    setWorking(`answer-${question.id}`); setError(''); setNotice('');
    try {
      await api.post(`/interviews/${activeSession.id}/answers`, { question_id: question.id, answer_text: answer });
      setNotice('Answer saved to this practice session.');
      const response = await api.get(`/interviews/${activeSession.id}`);
      setActiveSession(response.data.data.interview);
    } catch (err) { setError(err.response?.data?.message || 'Unable to save this answer.'); }
    finally { setWorking(''); }
  };

  const getFeedback = async (question) => {
    const answer = (answers[question.id] || '').trim();
    if (!answer) { setError('Write an answer before asking for feedback.'); return; }
    setWorking(`feedback-${question.id}`); setError('');
    try {
      const response = await api.post('/ai/chat', { message: `Give concise interview-practice feedback on this ${activeSession.type} interview answer. Identify one strength and one specific improvement. Do not invent facts. Question: ${question.question_text}\nAnswer: ${answer}` });
      setFeedback((current) => ({ ...current, [question.id]: response.data.data.response }));
    } catch (err) { setError(err.response?.data?.message || 'Feedback is unavailable right now.'); }
    finally { setWorking(''); }
  };

  if (loading) return <div className="page-loading">Loading interview practice…</div>;

  return <div className="page-section interviews-page">
    <header className="page-heading"><div><div className="eyebrow">Practice with purpose</div><h2>Interview practice</h2><p>Create a session, answer role-specific prompts, save your practice, and get focused feedback.</p></div></header>
    <div className="interview-how panel-card"><div className="interview-how-icon"><FiMessageCircle /></div><div><strong>These are private practice sessions</strong><p>They are not real interviews or calendar invitations. Choose a format, add questions, write answers, and ask the coach for feedback.</p></div></div>
    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
    {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}

    <div className="interview-layout">
      <section className="panel-card interview-create-card"><div className="panel-header"><div><span className="eyebrow">New practice</span><h3>Set up a session</h3></div></div>
        <form onSubmit={handleCreate} className="interview-form">
          <label>Practice format<select className="form-select" name="type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option value="technical">Technical</option><option value="behavioral">Behavioral</option><option value="hr">General / HR</option></select></label>
          <label>Role or session name<input className="form-control" name="title" value={form.title} maxLength={150} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label>
          <label>Practice reminder (optional)<input className="form-control" type="datetime-local" name="scheduled_at" value={form.scheduled_at} onChange={(event) => setForm((current) => ({ ...current, scheduled_at: event.target.value }))} /></label>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create practice session'}</button>
        </form>
      </section>

      <section className="panel-card interview-sessions-card"><div className="panel-header"><div><span className="eyebrow">Your practice library</span><h3>Sessions <span className="resume-count">{sessions.length}</span></h3></div><button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => loadSessions().catch((err) => setError(err.response?.data?.message || 'Could not refresh sessions.'))}><FiRefreshCw /> Refresh</button></div>
        {sessions.length ? <div className="interview-session-list">{sessions.map((session) => <button type="button" key={session.id} className={`interview-session-row${activeSession?.id === session.id ? ' selected' : ''}`} onClick={() => openSession(session.id)}>
          <span className="interview-session-icon"><FiCalendar /></span><span className="interview-session-copy"><strong>{session.title || session.type}</strong><small>{session.type} · {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Flexible practice'} · {session.status || 'active'}</small></span><span className="interview-session-count">Open practice</span>
        </button>)}</div> : <div className="interview-empty"><strong>No practice sessions yet</strong><p>Create one to start working through interview questions.</p></div>}
      </section>
    </div>

    {activeSession ? <section className="panel-card interview-practice-panel"><div className="panel-header"><div><span className="eyebrow">Active practice</span><h3>{activeSession.title || activeSession.type}</h3><p>Answer at your own pace. Your saved answers stay linked to this session.</p></div><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setActiveSession(null)}>Close</button></div>
      {activeSession.questions?.length ? <div className="practice-question-list">{activeSession.questions.map((question, index) => <article className="practice-question" key={question.id}><div className="practice-question-title"><span>{String(index + 1).padStart(2, '0')}</span><strong>{question.question_text}</strong></div><label htmlFor={`answer-${question.id}`}>Your answer</label><textarea id={`answer-${question.id}`} className="form-control" rows="5" maxLength="10000" value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} /><div className="practice-question-actions"><button type="button" className="btn btn-outline-primary btn-sm" onClick={() => saveAnswer(question)} disabled={working !== ''}>{working === `answer-${question.id}` ? 'Saving…' : 'Save answer'}</button><button type="button" className="btn btn-primary btn-sm" onClick={() => getFeedback(question)} disabled={working !== ''}>{working === `feedback-${question.id}` ? 'Reviewing…' : 'Get coach feedback'}</button></div>{feedback[question.id] ? <div className="interview-feedback"><strong>Coach feedback</strong><p>{feedback[question.id]}</p></div> : null}</article>)}</div> : <div className="interview-empty"><strong>This session has no questions yet</strong><p>Add a short question set for the selected interview format.</p><button type="button" className="btn btn-primary" onClick={addQuestionSet} disabled={working !== ''}><FiPlus /> {working === 'questions' ? 'Adding…' : 'Add practice questions'}</button></div>}
    </section> : null}
  </div>;
}
