import { useEffect, useState } from 'react';
import { FiActivity, FiArrowRight, FiBriefcase, FiCalendar, FiExternalLink, FiFileText, FiSave } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';

const statuses = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];
const dateValue = (value) => value ? String(value).slice(0, 10) : '';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/applications')
      .then((response) => { if (active) setApplications(response.data?.data?.applications || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load your application tracker.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateField = (id, field, value) => setApplications((items) => items.map((item) => Number(item.id) === Number(id) ? { ...item, [field]: value } : item));
  const saveApplication = async (application) => {
    setSavingId(application.id); setError(''); setNotice('');
    try {
      const response = await api.put(`/applications/${application.id}`, { status: application.status, next_action_date: application.next_action_date || null, notes: application.notes || '' });
      const saved = response.data?.data?.application;
      setApplications((items) => items.map((item) => Number(item.id) === Number(application.id) ? { ...item, ...saved } : item));
      setNotice(`Tracker updated for ${application.job_title || 'this role'}.`);
    } catch (err) { setError(err.response?.data?.message || 'Unable to save this application update.'); }
    finally { setSavingId(null); }
  };

  if (loading) return <div className="page-loading" role="status">Loading application tracker…</div>;
  const activeCount = applications.filter((item) => !['offer', 'rejected', 'withdrawn'].includes(item.status)).length;

  return <div className="page-section applications-workspace">
    <div className="page-heading"><div><div className="eyebrow">YOUR JOB SEARCH PIPELINE</div><h2>Applications</h2><p>Record what you submitted externally, manage each stage, and plan the next follow-up.</p></div><Link to="/jobs" className="applications-add-link"><FiBriefcase /> Find roles</Link></div>
    {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}{notice ? <div className="alert alert-success" role="status">{notice}</div> : null}
    <div className="application-summary-row"><div><span>Tracked roles</span><strong>{applications.length}</strong></div><div><span>Active pipeline</span><strong>{activeCount}</strong></div><div><span>Interview stage</span><strong>{applications.filter((item) => item.status === 'interview').length}</strong></div><div><span>Offers</span><strong>{applications.filter((item) => item.status === 'offer').length}</strong></div></div>
    {applications.length ? <section className="application-tracker-list" aria-label="Tracked applications">{applications.map((application) => <article className="application-tracker-card" key={application.id}>
      <div className="application-tracker-heading"><span className="application-company-mark"><FiBriefcase /></span><div className="application-role-title"><h3>{application.job_title || 'Saved role'}</h3><p>{[application.company, application.location].filter(Boolean).join(' · ') || 'Company details not listed'}</p></div><span className={`application-status-label status-${application.status}`}>{application.status}</span></div>
      <div className="application-tracker-fields"><label>Current stage<select value={application.status} onChange={(event) => updateField(application.id, 'status', event.target.value)}>{statuses.map((status) => <option value={status} key={status}>{status.replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></label><label>Next follow-up <span>Optional reminder</span><input type="date" value={dateValue(application.next_action_date)} onChange={(event) => updateField(application.id, 'next_action_date', event.target.value)} /></label><label className="application-notes-field">Notes <span>Visible only in your workspace</span><input type="text" maxLength={2000} value={application.notes || ''} onChange={(event) => updateField(application.id, 'notes', event.target.value)} placeholder="Recruiter, follow-up, or interview notes" /></label></div>
      <div className="application-tracker-footer"><small>Added {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'recently'}{application.interview_date ? ` · Interview ${new Date(application.interview_date).toLocaleString()}` : ''}</small><div><Link to={`/jobs/${application.job_id}`}><FiExternalLink /> Role details</Link><Link to={`/interviews?jobId=${application.job_id}`}><FiActivity /> Practice</Link><button type="button" onClick={() => saveApplication(application)} disabled={savingId === application.id}><FiSave /> {savingId === application.id ? 'Saving…' : 'Save changes'}</button></div></div>
    </article>)}</section> : <section className="application-empty panel-card"><span className="application-empty-icon"><FiFileText /></span><h3>Start your application tracker</h3><p>Save a real role, apply on the employer’s website, then return to the role page and choose “Mark as applied”. CareerPilot keeps your progress and reminders here.</p><Link to="/jobs" className="interview-primary-button">Browse roles <FiArrowRight /></Link><small>CareerPilot does not submit applications to employers.</small></section>}
    {applications.length ? <p className="application-tracker-note"><FiCalendar /> Use follow-up reminders to keep your pipeline current. “Mark as applied” only records your status after you apply on the employer’s site.</p> : null}
  </div>;
}
