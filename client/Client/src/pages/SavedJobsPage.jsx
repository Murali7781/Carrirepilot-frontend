import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiArrowRight, FiBookmark } from 'react-icons/fi';
import { getSavedJobs, unsaveJob } from '../services/jobsService';

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getSavedJobs({ page, signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setJobs(result.jobs || []);
        setPagination(result.pagination || { page, limit: 20, total: 0, totalPages: 0 });
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted) setError(requestError.response?.data?.message || 'Unable to load saved jobs.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setPageLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, refreshKey]);

  const removeJob = async (job) => {
    setError('');
    try {
      await unsaveJob(job.job_id, job.id);
      setPageLoading(true);
      if (jobs.length === 1 && page > 1) setPage(page - 1);
      else setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove this saved role.');
    }
  };

  if (loading) return <div className="page-loading">Loading saved jobs...</div>;

  return (
    <div className="page-section">
      <div className="page-heading"><div><div className="eyebrow">Your shortlist</div><h2>Saved jobs</h2><p>Roles worth a closer look, ready whenever you are.</p></div></div>
      {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
      {pageLoading && jobs.length ? <p className="application-page-status" role="status">Updating saved roles…</p> : null}
      <div className="panel-card">
        {jobs.length ? <div className="stack-list">{jobs.map((job) => <div className="stack-item" key={job.id}><div><strong>{job.title}</strong><div className="text-muted small">{job.company || 'Company not specified'}</div></div><div className="inline-actions"><button className="btn btn-light btn-sm" type="button" onClick={() => removeJob(job)} disabled={pageLoading}><FiBookmark size={15} /> Remove</button><Link className="btn btn-outline-secondary btn-sm" to={`/interviews?jobId=${job.job_id}`}><FiActivity size={15} /> Practice</Link><Link className="btn btn-primary btn-sm" to={`/jobs/${job.job_id}`}><FiArrowRight size={15} /> Review</Link></div></div>)}</div> : <div className="empty-state compact"><div className="empty-icon"><FiBookmark /></div><h3>Your shortlist is empty</h3><p>Save promising roles from Find Jobs to compare them later.</p><Link className="btn btn-primary" to="/jobs">Find jobs</Link></div>}
      </div>
      {pagination.totalPages > 1 ? <nav className="list-pagination" aria-label="Saved job pages"><button type="button" className="btn btn-light btn-sm" onClick={() => { setPageLoading(true); setPage(page - 1); }} disabled={pageLoading || page <= 1}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" className="btn btn-light btn-sm" onClick={() => { setPageLoading(true); setPage(page + 1); }} disabled={pageLoading || page >= pagination.totalPages}>Next</button></nav> : null}
    </div>
  );
}
