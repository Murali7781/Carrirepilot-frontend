import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiClock, FiFileText, FiPlus, FiSend, FiTarget } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.scss';
import DashboardStats from '../components/dashboard/DashboardStats';

const pipelineStatuses = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'];
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

function relativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/dashboard/summary', { signal: controller.signal })
      .then((response) => { if (!controller.signal.aborted) setSummary(response.data.data.summary || response.data.data); })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.response?.data?.message || 'Dashboard data is unavailable. Try again.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refreshKey]);

  const counts = summary?.counts || {};
  const pipeline = useMemo(() => {
    const raw = summary?.applicationPipeline || [];
    const byStatus = new Map(raw.map((item) => [String(item.status).toLowerCase(), Number(item.total) || 0]));
    return pipelineStatuses.map((status) => ({ status, count: byStatus.get(status) || 0 }));
  }, [summary]);
  const activityMonths = useMemo(() => {
    const countsByMonth = new Map((summary?.applicationActivity || []).map((item) => [item.month, Number(item.total) || 0]));
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return { key, label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date), total: countsByMonth.get(key) || 0 };
    });
  }, [summary]);
  const activityMaximum = Math.max(1, ...activityMonths.map((month) => month.total));
  const totalApplications = pipeline.reduce((total, item) => total + item.count, 0);
  const completionFields = [summary?.profile?.name || user?.name, summary?.profile?.email || user?.email, summary?.profile?.targetRole, (counts.resumes || 0) > 0];
  const profileCompletion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);
  const firstName = (summary?.profile?.name || user?.name || '').trim().split(/\s+/)[0];
  const role = summary?.profile?.targetRole || user?.targetRole;
  const nextAction = (counts.resumes || 0) === 0
    ? { icon: FiFileText, title: 'Add your resume', description: 'Create a profile recruiters can learn from, then compare it with roles you want.', link: '/resumes', action: 'Add resume' }
    : (counts.applications || 0) === 0
      ? { icon: FiBriefcase, title: 'Start a focused job search', description: 'Save roles that fit your goals and track them after applying.', link: '/jobs', action: 'Explore jobs' }
        : (counts.overdue_followups || 0) > 0
          ? { icon: FiClock, title: 'Follow up on an application', description: `${counts.overdue_followups} follow-up${counts.overdue_followups === 1 ? '' : 's'} ${counts.overdue_followups === 1 ? 'is' : 'are'} past the reminder date.`, link: '/applications', action: 'Review follow-ups' }
        : (counts.applications || 0) > 0 && (counts.practice_sessions || 0) === 0
          ? { icon: FiTarget, title: 'Prepare for the conversation', description: 'Practice role-aware interview questions using a resume from your workspace.', link: '/interviews', action: 'Start interview practice' }
          : { icon: FiTarget, title: 'Keep your momentum', description: 'Review your pipeline and choose one useful next step for today.', link: '/applications', action: 'View pipeline' };
  const NextIcon = nextAction.icon;

  return <div className="page-section dashboard-page">
    <header className="dashboard-heading">
      <div className="dashboard-heading-copy"><span className="dashboard-overline">CAREER WORKSPACE · {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</span><h2>{getGreeting()}{firstName ? `, ${firstName}` : ''}</h2><p>{role ? `Your ${role} journey, in one clear view.` : 'Your career progress and next steps, in one clear view.'}</p></div>
      <div className="dashboard-career-visual" aria-hidden="true">
        <div className="career-visual-orbit career-visual-orbit-one" />
        <div className="career-visual-orbit career-visual-orbit-two" />
        <div className="career-visual-sheet career-visual-sheet-back"><span /><span /><span /></div>
        <div className="career-visual-sheet career-visual-sheet-front"><span className="career-visual-mark">CP</span><span className="career-visual-lines"><i /><i /><i /></span><span className="career-visual-pill">CAREER PLAN</span></div>
        <span className="career-visual-float career-visual-resume"><FiFileText /></span>
        <span className="career-visual-float career-visual-role"><FiBriefcase /></span>
        <span className="career-visual-float career-visual-interview"><FiTarget /></span>
      </div>
      <Link to="/jobs" className="dashboard-primary-action"><FiPlus /> Find a role</Link>
    </header>

    {error ? <div className="dashboard-error" role="alert"><span>{error}</span><button type="button" onClick={() => { setLoading(true); setError(''); setRefreshKey((value) => value + 1); }}>Retry</button></div> : null}

    <DashboardStats counts={counts} loading={loading} />

    {loading ? <div className="dashboard-skeleton-grid" role="status" aria-label="Loading dashboard details" aria-busy="true">
      <section className="dashboard-panel skeleton-panel">
        <span className="skeleton-line skeleton-heading" />
        <span className="skeleton-line skeleton-caption" />
        <div className="skeleton-chart">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
      </section>
      <section className="dashboard-panel skeleton-panel">
        <span className="skeleton-line skeleton-heading" />
        <span className="skeleton-line skeleton-copy" />
        <span className="skeleton-line skeleton-copy short" />
        <span className="skeleton-line skeleton-action" />
      </section>
      <section className="dashboard-panel skeleton-panel skeleton-wide">
        <span className="skeleton-line skeleton-heading" />
        <span className="skeleton-line skeleton-row" />
        <span className="skeleton-line skeleton-row" />
      </section>
      <div className="skeleton-lower-grid skeleton-wide">
        {[0, 1, 2].map((item) => <section className="dashboard-panel skeleton-panel" key={item}>
          <span className="skeleton-line skeleton-heading" />
          <span className="skeleton-line skeleton-row" />
          <span className="skeleton-line skeleton-row" />
        </section>)}
      </div>
    </div> : <>
    <div className="dashboard-main-grid">
      <section className="dashboard-panel activity-chart-panel">
        <div className="dashboard-panel-heading"><div><span className="dashboard-overline">JOB SEARCH ACTIVITY</span><h3>Applications over time</h3></div><Link to="/applications" className="dashboard-text-link">View applications <FiArrowRight /></Link></div>
        <p className="chart-caption">Applications you have added to CareerPilot, grouped by month.</p>
        <div className="activity-chart" role="img" aria-label={`Applications over the last six months: ${activityMonths.map((month) => `${month.label}: ${month.total}`).join(', ')}`}>
          {activityMonths.map((month) => <div className="activity-chart-column" key={month.key}><span className="activity-chart-value">{month.total || ''}</span><div className="activity-chart-track"><span style={{ height: `${month.total ? Math.max(8, month.total / activityMaximum * 100) : 3}%` }} /></div><small>{month.label}</small></div>)}
        </div>
        {!totalApplications ? <div className="chart-empty-note">Your monthly activity will appear as you add applications.</div> : null}
      </section>

      <section className="dashboard-panel next-action-panel">
        <div className="dashboard-panel-heading"><div><span className="dashboard-overline">SUGGESTED NEXT STEP</span><h3>Keep moving forward</h3></div><span className="next-step-icon"><NextIcon /></span></div>
        <div className="next-step-copy"><strong>{nextAction.title}</strong><p>{nextAction.description}</p></div>
        <Link to={nextAction.link} className="dashboard-primary-action dashboard-action-small">{nextAction.action}<FiArrowRight /></Link>
        <div className="profile-progress"><div className="profile-progress-head"><span>Workspace readiness</span><strong>{profileCompletion}%</strong></div><div className="profile-progress-track"><span style={{ width: `${profileCompletion}%` }} /></div><small>Based on your profile and saved resume</small></div>
      </section>
    </div>

    <section className="dashboard-panel pipeline-panel">
      <div className="dashboard-panel-heading"><div><span className="dashboard-overline">APPLICATION STATUS</span><h3>Your pipeline</h3></div><Link to="/applications" className="dashboard-text-link">Open tracker <FiArrowRight /></Link></div>
      {totalApplications ? <>
        <div className="pipeline-total"><strong>{totalApplications}</strong><span>{totalApplications === 1 ? 'application tracked' : 'applications tracked'}</span></div>
        <div className="pipeline-bar" role="img" aria-label={pipeline.filter((item) => item.count).map((item) => `${item.count} ${item.status}`).join(', ')}>
          {pipeline.filter((item) => item.count).map((item) => <span key={item.status} className={`pipeline-segment status-${item.status}`} style={{ width: `${item.count / totalApplications * 100}%` }} />)}
        </div>
        <div className="pipeline-legend">{pipeline.map((item) => <div key={item.status} className={`pipeline-key${item.count ? '' : ' is-empty'}`}><span className={`pipeline-dot status-${item.status}`} /><span>{titleCase(item.status)}</span><strong>{item.count}</strong></div>)}</div>
      </> : <div className="dashboard-empty dashboard-empty-inline"><span className="dashboard-empty-icon"><FiSend /></span><div><strong>Your pipeline starts with one role</strong><p>Track applications after applying on the employer’s site.</p></div><Link to="/jobs">Browse jobs <FiArrowRight /></Link></div>}
    </section>

    <div className="dashboard-bottom-grid">
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading"><div><span className="dashboard-overline">SAVED FOR LATER</span><h3>Saved roles</h3></div><Link to="/saved-jobs" className="dashboard-text-link">View saved <FiArrowRight /></Link></div>
        {summary?.savedRoles?.length ? <div className="dashboard-role-list">{summary.savedRoles.slice(0, 4).map((job) => <article className="dashboard-role-row" key={job.saved_id}><span className="dashboard-role-icon"><FiBriefcase /></span><div><strong>{job.title}</strong><small>{job.company || 'Company not listed'}{job.location ? ` · ${job.location}` : ''}</small></div><span className="dashboard-role-date">{relativeDate(job.saved_at)}</span></article>)}</div> : <div className="dashboard-compact-empty">No saved roles yet. <Link to="/jobs">Search opportunities</Link></div>}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading"><div><span className="dashboard-overline">RECENT ACTIVITY</span><h3>Latest updates</h3></div></div>
        {summary?.recentActivity?.length ? <div className="dashboard-activity-list">{summary.recentActivity.slice(0, 5).map((item) => <div className="dashboard-activity-row" key={`${item.type}-${item.id}`}><span className={`activity-mark ${item.type}`} /> <div><strong>{item.type === 'saved_job' ? 'Saved a role' : item.type === 'interview' ? 'Interview practice · ' + titleCase(item.label || 'active') : `Application · ${titleCase(item.label || 'updated')}`}</strong><small>{item.title}{item.company ? ` at ${item.company}` : ''}</small></div><time>{relativeDate(item.occurred_at)}</time></div>)}</div> : <div className="dashboard-compact-empty">Your saves, interview practice, and application updates will show here.</div>}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading"><div><span className="dashboard-overline">CAREER DEVELOPMENT</span><h3>Skills to focus on</h3></div><Link to="/skills" className="dashboard-text-link">View skills <FiArrowRight /></Link></div>
        {summary?.skillGaps?.length ? <div className="dashboard-skill-list">{summary.skillGaps.slice(0, 4).map((skill) => <div className="dashboard-skill-row" key={skill.id || skill.skill_name}><span><FiTarget /></span><div><strong>{skill.skill_name}</strong><small>{skill.role_title ? `Not listed for ${skill.role_title}` : 'From a recent resume comparison'}</small></div><span className="skill-priority">Review</span></div>)}</div> : <div className="dashboard-compact-empty">Compare a resume with a role to see skills missing from that match. <Link to="/skills">Explore skills</Link></div>}
      </section>
    </div>

    <footer className="dashboard-footer-note"><FiCheckCircle /> Counts are based on your saved CareerPilot data. Applications are tracked here; CareerPilot does not submit them to employers.</footer>
    </>}
  </div>;
}
