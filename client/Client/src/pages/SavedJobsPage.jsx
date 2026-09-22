import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookmark } from 'react-icons/fi';
import { getSavedJobs, unsaveJob } from '../services/jobsService';

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedJobs().then((items) => setJobs(items))
      .catch((error) => console.error('Unable to load saved jobs.', error))
      .finally(() => setLoading(false));
  }, []);

  const removeJob = async (job) => {
    await unsaveJob(job.job_id, job.id);
    setJobs((current) => current.filter((item) => item.id !== job.id));
  };

  if (loading) return <div className="page-loading">Loading saved jobs...</div>;

  return (
    <div className="page-section">
      <div className="page-heading"><div><div className="eyebrow">Your shortlist</div><h2>Saved jobs</h2><p>Roles worth a closer look, ready whenever you are.</p></div></div>
      <div className="panel-card">
        {jobs.length ? <div className="stack-list">{jobs.map((job) => <div className="stack-item" key={job.id}><div><strong>{job.title}</strong><div className="text-muted small">{job.company || 'Company not specified'}</div></div><div className="inline-actions"><button className="btn btn-light btn-sm" type="button" onClick={() => removeJob(job)}><FiBookmark size={15} /> Remove</button><Link className="btn btn-primary btn-sm" to={`/jobs/${job.job_id}`}><FiArrowRight size={15} /> Review</Link></div></div>)}</div> : <div className="empty-state compact"><div className="empty-icon"><FiBookmark /></div><h3>Your shortlist is empty</h3><p>Save promising roles from Find Jobs to compare them later.</p><Link className="btn btn-primary" to="/jobs">Find jobs</Link></div>}
      </div>
    </div>
  );
}
