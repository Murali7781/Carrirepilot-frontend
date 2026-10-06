import { FiBriefcase, FiFileText, FiMessageSquare, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const stats = [
  { key: 'applications', label: 'Applications', detail: 'In your pipeline', icon: FiSend, to: '/applications', tone: 'blue' },
  { key: 'practice_sessions', label: 'Practice sessions', detail: 'Interview preparation', icon: FiMessageSquare, to: '/interviews', tone: 'violet' },
  { key: 'saved_jobs', label: 'Saved roles', detail: 'Shortlisted for later', icon: FiBriefcase, to: '/saved-jobs', tone: 'green' },
  { key: 'resumes', label: 'Resumes', detail: 'In your workspace', icon: FiFileText, to: '/resumes', tone: 'amber' },
];

export default function DashboardStats({ counts = {} }) {
  return <section className="dashboard-stats" aria-label="Career search metrics">
    {stats.map(({ key, label, detail, icon: Icon, to, tone }) => <Link className={`dashboard-stat-card tone-${tone}`} to={to} key={key}>
      <span className="dashboard-stat-icon"><Icon /></span><span className="dashboard-stat-label">{label}</span><strong>{Number(counts[key]) || 0}</strong><small>{detail}</small>
    </Link>)}
  </section>;
}
