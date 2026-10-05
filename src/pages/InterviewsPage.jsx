import { useEffect, useState } from 'react';
import { FiArrowRight, FiBriefcase, FiClock, FiFileText, FiMessageCircle, FiPlus, FiTarget } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const initialForm = { type: 'technical', title: '', job_id: '', resume_id: '' };
const typeLabels = { technical: 'Technical', behavioral: 'Behavioral', hr: 'HR', mixed: 'Mixed practice' };

export default function InterviewsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [form, setForm] = useState(() => ({ ...initialForm, job_id: searchParams.get('jobId') || '', resume_id: searchParams.get('resumeId') || '' }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/interviews'), api.get('/jobs'), api.get('/resumes')])
      .then(([sessionResponse, jobResponse, resumeResponse]) => {
        if (!active) return;
        setSessions(sessionResponse.data?.data?.interviews || []);
        setJobs(jobResponse.data?.data?.jobs || []);
        setResumes(resumeResponse.data?.data?.resumes || []);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load your interview workspace.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const createSession = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await api.post('/interviews', {
        ...form,
        job_id: form.job_id ? Number(form.job_id) : null,
        resume_id: form.resume_id ? Number(form.resume_id) : null,
      });
      const created = response.data?.data?.interview;
      if (created?.id) { navigate(`/interviews/${created.id}`); return; }
      setForm(initialForm);
    } catch (err) { setError(err.response?.data?.message || 'Unable to create this practice session.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading" role="status">Loading interview practice…</div>;
  return <div className="page-section interview-workspace">
    <section className="interview-welcome">
      <div className="interview-welcome-copy"><span className="eyebrow">PRACTICE WITH PURPOSE</span><h2>Make the next interview feel familiar.</h2><p>Choose a role, use your resume as context, and practice with relevant questions and feedback. Live AI can add deeper coaching when configured; local practice remains available without it.</p><div className="interview-welcome-links"><Link to="/jobs"><FiBriefcase /> Find a role</Link><Link to="/resumes"><FiFileText /> Update a resume</Link><span><FiMessageCircle /> Career assistant is available in the corner</span></div></div>
      <div className="interview-welcome-art" aria-hidden="true"><div className="interview-art-ring"><FiMessageCircle /><span>Practice</span></div><div className="interview-art-note note-one">Tell me about a challenge you solved.</div><div className="interview-art-note note-two">Take a moment to think.</div></div>
    </section>
    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
    <div className="interview-content-grid">
      <section className="panel-card interview-create-card">
        <div className="interview-section-title"><span className="interview-icon"><FiPlus /></span><div><span className="eyebrow">NEW PRACTICE</span><h3>Set up a session</h3><p>Connect practice to a role and resume for relevant questions.</p></div></div>
        <form onSubmit={createSession} className="interview-form">
          <label htmlFor="practice-type">Practice focus<select id="practice-type" value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))}><option value="technical">Technical interview</option><option value="behavioral">Behavioral interview</option><option value="hr">HR / introductory</option><option value="mixed">Mixed practice</option></select></label>
          <label htmlFor="practice-job">Role context <span>Optional</span><select id="practice-job" value={form.job_id} onChange={(e) => setForm((current) => ({ ...current, job_id: e.target.value }))}><option value="">General practice</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}{job.company ? ` · ${job.company}` : ''}</option>)}</select></label>
          <label htmlFor="practice-resume">Resume context <span>Optional</span><select id="practice-resume" value={form.resume_id} onChange={(e) => setForm((current) => ({ ...current, resume_id: e.target.value }))}><option value="">No resume selected</option>{resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}</select></label>
          <label htmlFor="practice-title">Session name <span>Optional</span><input id="practice-title" maxLength={150} value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. Product designer · first round" /></label>
          <button type="submit" className="interview-primary-button" disabled={saving}>{saving ? 'Creating session…' : 'Create practice session'} <FiArrowRight /></button>
          {!jobs.length ? <p className="interview-form-hint"><Link to="/jobs">Add a real job posting</Link> first to tailor practice for a specific opportunity.</p> : null}
        </form>
      </section>
      <section className="interview-session-section">
        <div className="interview-list-heading"><div><span className="eyebrow">YOUR PREPARATION</span><h3>Practice sessions</h3></div><span className="interview-count">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span></div>
        {sessions.length ? <div className="interview-session-list">{sessions.map((session) => <article className="interview-session-card" key={session.id}>
          <div className="session-type-mark"><FiMessageCircle /></div><div className="session-card-body"><div className="session-card-title-row"><h4>{session.title || typeLabels[session.type] || 'Interview practice'}</h4><span className={`session-status ${session.status}`}>{session.status || 'active'}</span></div>
            <p>{typeLabels[session.type] || session.type} practice{session.job_title ? ` · ${session.job_title}${session.job_company ? ` at ${session.job_company}` : ''}` : ' · General role practice'}</p>
            <div className="session-meta"><span><FiTarget /> {session.answer_count || 0}/{session.question_count || 0} answers</span>{session.resume_title ? <span><FiFileText /> {session.resume_title}</span> : <span><FiClock /> {new Date(session.created_at).toLocaleDateString()}</span>}</div>
          </div><Link className="session-open-link" to={`/interviews/${session.id}`} aria-label={`Open ${session.title || 'practice session'}`}><FiArrowRight /></Link>
        </article>)}</div> : <div className="interview-empty panel-card"><span className="interview-empty-icon"><FiMessageCircle /></span><h4>Your practice history starts here</h4><p>Create a session to get role-aware questions, record your answers, and review AI feedback.</p><a href="#practice-type">Set up your first session <FiArrowRight /></a></div>}
      </section>
    </div>
    <p className="interview-privacy-note">AI generated questions and feedback are practice guidance. Review them alongside the actual employer posting and your own experience.</p>
  </div>;
}
