import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    api.get('/applications')
      .then((response) => setApplications(response.data.data.applications || []))
      .catch((error) => {
        if ([404, 405].includes(error.response?.status)) setAvailable(false);
        else console.error('Unable to load applications.', error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading applications...</div>;

  return (
    <div className="page-section">
      <div className="page-heading">
        <div><div className="eyebrow">Your pipeline</div><h2>Applications</h2><p>Keep every opportunity moving forward in one place.</p></div>
      </div>
      <div className="panel-card empty-state">
        {available && applications.length ? applications.map((application) => (
          <div className="stack-item" key={application.id}>
            <div><strong>{application.job_title || 'Job application'}</strong><div className="text-muted small">{application.company || 'Company'} · {application.status || 'Applied'}</div></div>
            <span className="badge bg-primary-subtle text-primary">{application.status || 'Applied'}</span>
          </div>
        )) : (
          <>
            <div className="empty-icon"><span>✓</span></div>
            <h3>{available ? 'No applications yet' : 'Application tracking is coming soon'}</h3>
            <p>{available ? 'Apply to a role from Find Jobs and your pipeline will appear here.' : 'The current API does not expose applications yet. You can still browse and save roles.'}</p>
          </>
        )}
      </div>
    </div>
  );
}
