import { Link } from 'react-router-dom';

export default function CareerOverview({ skillGapsCount, matchesCount, resumesCount }) {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>Career overview</h3>
      </div>
      <div className="dashboard-grid">
        <div className="mini-stat">
          <span>Skill gaps</span>
          <strong>{skillGapsCount}</strong>
        </div>
        <div className="mini-stat">
          <span>Match analyses</span>
          <strong>{matchesCount}</strong>
        </div>
        <div className="mini-stat">
          <span>Resume status</span>
          <strong>{resumesCount > 0 ? 'Ready' : 'Add one'}</strong>
        </div>
      </div>

      <div className="mt-4">
        <h4>Quick actions</h4>
        <div className="quick-actions">
          <Link to="/resumes" className="action-link">Manage resumes</Link>
          <Link to="/jobs" className="action-link">Explore jobs</Link>
          <Link to="/interviews" className="action-link">Plan interview</Link>
          <Link to="/ai" className="action-link">AI coach</Link>
        </div>
      </div>
    </div>
  );
}
