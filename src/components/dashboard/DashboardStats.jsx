const stats = [
  { key: 'profile', label: 'Profile', detail: 'Completion', className: 'accent-purple' },
  { key: 'resumes', label: 'Resumes', detail: 'Saved', className: 'accent-blue' },
  { key: 'applications', label: 'Applications', detail: 'Tracked roles', className: 'accent-green' },
  { key: 'interviews', label: 'Interview practice', detail: 'Sessions', className: 'accent-gold' },
];

export default function DashboardStats({ profileProgress, resumesCount, applicationsCount, interviewsCount }) {
  const values = {
    profile: profileProgress,
    resumes: resumesCount,
    applications: applicationsCount,
    interviews: interviewsCount,
  };

  return (
    <div className="dashboard-stats-grid">
      {stats.map((stat) => (
        <div className="dashboard-grid-column" key={stat.key}>
          <div className={`stat-card ${stat.className}`}>
            <span>{stat.label}</span>
            <strong>{values[stat.key]}{stat.key === 'profile' ? '%' : ''}</strong>
            <small>{stat.detail}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
