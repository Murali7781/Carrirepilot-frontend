const stats = [
  { key: 'profile', label: 'Profile', detail: 'Completion', className: 'accent-purple' },
  { key: 'resumes', label: 'Resumes', detail: 'Saved', className: 'accent-blue' },
  { key: 'jobs', label: 'Jobs', detail: 'Tracked', className: 'accent-green' },
  { key: 'interviews', label: 'Interviews', detail: 'Sessions', className: 'accent-gold' },
];

export default function DashboardStats({ profileProgress, resumesCount, jobsCount, interviewsCount }) {
  const values = {
    profile: profileProgress,
    resumes: resumesCount,
    jobs: jobsCount,
    interviews: interviewsCount,
  };

  return (
    <div className="row g-4 mb-4">
      {stats.map((stat) => (
        <div className="col-md-3" key={stat.key}>
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
