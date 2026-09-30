import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiCalendar, FiCheckCircle, FiClock, FiSend } from 'react-icons/fi';
import api from '../services/api';

const statuses = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];
const readable = (status) => status.charAt(0).toUpperCase() + status.slice(1);

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data.data.applications || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Your application tracker could not load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/applications').then((response) => {
      if (active) setApplications(response.data.data.applications || []);
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'Your application tracker could not load. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => statuses.reduce((total, status) => ({
    ...total,
    [status]: applications.filter((item) => item.status === status).length,
  }), {}), [applications]);
  const visible = filter === 'all' ? applications : applications.filter((item) => item.status === filter);

  const updateApplication = async (application, changes) => {
    setSavingId(application.id);
    setNotice('');
    setError('');
    try {
      const response = await api.put(`/applications/${application.id}`, changes);
      const updated = response.data.data.application;
      setApplications((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setNotice('Application updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this application.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="page-loading">Loading your application tracker…</div>;

  return <div className="page-section applications-page">
    <header className="page-heading"><div><div className="eyebrow">Your pipeline</div><h2>Applications</h2><p>Track roles you have applied to, update progress, and keep your next action visible.</p></div><Link className="btn btn-primary" to="/jobs">Find roles</Link></header>

    <section className="application-explainer panel-card">
      <div className="application-explainer-icon"><FiSend /></div>
      <div><strong>How this tracker works</strong><p>Use “Track application” on a role after you apply on the employer’s site. CareerPilot records the role here; it does not submit applications for you. Update the status and follow-up date as you hear back.</p></div>
    </section>

    {error ? <div className="alert alert-danger" role="alert">{error}<button className="btn btn-sm btn-outline-danger ms-2" type="button" onClick={load}>Retry</button></div> : null}
    {notice ? <div className="alert alert-success" role="status">{notice}</div> : null}

    <div className="application-summary-grid">
      <article className="application-summary panel-card"><span>Total tracked</span><strong>{applications.length}</strong><small>Roles in your pipeline</small></article>
      <article className="application-summary panel-card"><span>In progress</span><strong>{(counts.applied || 0) + (counts.screening || 0) + (counts.interview || 0)}</strong><small>Applied, screening, or interviewing</small></article>
      <article className="application-summary panel-card"><span>Offers</span><strong>{counts.offer || 0}</strong><small>Offer stage</small></article>
    </div>

    <section className="panel-card application-list-panel">
      <div className="application-list-heading"><div><span className="eyebrow">Pipeline</span><h3>Your tracked roles</h3></div><label className="application-filter-label">Filter <select className="form-select" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></label></div>
      {visible.length ? <div className="application-list">{visible.map((application) => <article className="application-card" key={application.id}>
        <div className="application-card-top"><div className="application-job-icon">{String(application.title || application.job_title || 'R').slice(0, 1).toUpperCase()}</div><div className="application-role"><h4>{application.title || application.job_title || 'Job application'}</h4><p>{application.company || 'Company not listed'}</p></div><label className="application-status-control"><span>Status</span><select className={`form-select status-${application.status}`} value={application.status || 'applied'} disabled={savingId === application.id} onChange={(event) => updateApplication(application, { status: event.target.value })}>{statuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></label></div>
        <div className="application-card-meta"><span><FiCalendar /> Added {new Date(application.created_at).toLocaleDateString()}</span>{application.next_action_date ? <span><FiClock /> Follow up {new Date(`${String(application.next_action_date).slice(0, 10)}T12:00:00`).toLocaleDateString()}</span> : <span><FiClock /> No follow-up date</span>}</div>
        <div className="application-edit-grid"><label>Next follow-up date<input className="form-control" type="date" value={application.next_action_date ? String(application.next_action_date).slice(0, 10) : ''} onChange={(event) => updateApplication(application, { next_action_date: event.target.value || null })} /></label><label>Notes<textarea className="form-control" rows="2" maxLength="2000" defaultValue={application.notes || ''} onBlur={(event) => { if (event.target.value !== (application.notes || '')) updateApplication(application, { notes: event.target.value }); }} /></label></div>
        <div className="application-card-footer"><span>{savingId === application.id ? 'Saving…' : <><FiCheckCircle /> Changes save to your tracker</>}</span>{application.apply_url ? <a href={application.apply_url} target="_blank" rel="noreferrer noopener">Original posting <FiArrowUpRight /></a> : null}</div>
      </article>)}</div> : <div className="applications-empty"><div className="empty-icon"><FiSend /></div><h3>{applications.length ? 'No roles in this status' : 'Your tracker is ready'}</h3><p>{applications.length ? 'Choose another status filter to see more roles.' : 'After applying on an employer site, return to Find jobs and choose Track application. The role will appear here.'}</p>{!applications.length ? <Link to="/jobs" className="btn btn-primary">Explore jobs</Link> : null}</div>}
    </section>
  </div>;
}
