import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardStats from '../components/dashboard/DashboardStats';
import CareerOverview from '../components/dashboard/CareerOverview';
import ProfileSnapshot from '../components/dashboard/ProfileSnapshot';
import DashboardListPanel from '../components/dashboard/DashboardListPanel';

const formatSkillNames = (items = []) => {
  if (!items) return [];
  return Array.isArray(items) ? items : String(items).split(',');
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({
    resumes: [],
    jobs: [],
    interviews: [],
    skillGaps: [],
    matches: [],
  });
  const [loading, setLoading] = useState(true);
  const loadStarted = useRef(false);

  useEffect(() => {
    if (loadStarted.current) return undefined;
    loadStarted.current = true;

    const loadDashboard = async () => {
      try {
        const summaryResponse = await api.get('/dashboard/summary');
        const summary = summaryResponse.data.data.summary || summaryResponse.data.data;
        setDashboard({
          resumes: summary.resumes || [],
          jobs: summary.jobs || [],
          interviews: summary.interviews || [],
          skillGaps: summary.skillGaps || summary.skill_gaps || [],
          matches: summary.matches || [],
        });
      } catch (summaryError) {
        if (![404, 405].includes(summaryError.response?.status)) console.error('Unable to load dashboard summary.', summaryError);
        try {
          const [resumeResponse, jobsResponse, interviewsResponse, gapsResponse, matchesResponse] = await Promise.all([
          api.get('/resumes'),
          api.get('/jobs'),
          api.get('/interviews'),
          api.get('/skills/gaps'),
          api.get('/matches'),
          ]);

          setDashboard({
            resumes: resumeResponse.data.data.resumes || [],
            jobs: jobsResponse.data.data.jobs || [],
            interviews: interviewsResponse.data.data.interviews || [],
            skillGaps: gapsResponse.data.data.skills || [],
            matches: matchesResponse.data.data.matches || [],
          });
        } catch (error) {
          console.error('Unable to load dashboard data.', error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    return undefined;
  }, []);

  const profileProgress = useMemo(() => {
    if (!user) return 0;
    const fields = [user.name, user.email, user.mobile];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  return (
    <div className="page-section">
      <section className="career-landing">
        <header className="career-topbar">
          <div>
            <div className="eyebrow">Overview</div>
            <h2 className="career-brand">Good to see you, {user?.name || 'there'}</h2>
            <p className="career-subtitle">Here is your career activity at a glance.</p>
          </div>
          <Link to="/jobs" className="career-cta">Find opportunities</Link>
        </header>

        <div className="career-hero-grid">
          <div className="career-copy">
            <span className="career-kicker">Next best action</span>
            <h3>Build a stronger profile to unlock better matches.</h3>
            <p>Keep your resume, skills, and applications in one focused workspace.</p>
            <div className="career-upload-row">
              <Link to="/resumes" className="career-score-button">Manage resume</Link>
              <Link to="/profile" className="career-upload-box">Complete profile</Link>
            </div>
          </div>

          <div className="career-feature-panel">
            <div className="career-feature-label">workspace health</div>
            <div className="career-feature-line">
              <span className="feature-bullet" aria-hidden="true" />
              <span>{dashboard.matches.length} match analyses and {dashboard.jobs.length} tracked roles are available in your workspace.</span>
            </div>

            <div className="career-inline-card">
              <span className="inline-card-label">Profile completion</span>
              <span className="inline-card-pill">{profileProgress}%</span>
            </div>
          </div>
        </div>
      </section>

      <DashboardStats
        profileProgress={profileProgress}
        resumesCount={dashboard.resumes.length}
        jobsCount={dashboard.jobs.length}
        interviewsCount={dashboard.interviews.length}
      />

      <div className="row g-4">
        <div className="col-lg-7">
          <CareerOverview
            skillGapsCount={dashboard.skillGaps.length}
            matchesCount={dashboard.matches.length}
            resumesCount={dashboard.resumes.length}
          />
        </div>
        <div className="col-lg-5">
          <ProfileSnapshot profile={user} />
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <DashboardListPanel
            title="Latest skill gaps"
            items={dashboard.skillGaps.slice(0, 4)}
            emptyMessage="No skill gaps yet."
            renderItem={(item) => (
              <div key={`${item.skill_name}-${item.priority}`} className="stack-item">
                <div>
                  <strong>{item.skill_name}</strong>
                  <div className="text-muted small">{item.priority} priority</div>
                </div>
                <span className="badge bg-light text-dark">{item.current_level || 'Beginner'}</span>
              </div>
            )}
          />
        </div>
        <div className="col-lg-6">
          <DashboardListPanel
            title="Recent activity"
            items={dashboard.matches.slice(0, 4)}
            emptyMessage="No match analyses yet."
            renderItem={(item) => (
              <div key={item.id} className="stack-item">
                <div>
                  <strong>{item.job_title || 'Role match'}</strong>
                  <div className="text-muted small">Match score: {item.match_percentage}%</div>
                </div>
                <span className="badge bg-success-subtle text-success">{item.match_percentage}%</span>
              </div>
            )}
          />
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <DashboardListPanel
            title="Resumes"
            items={dashboard.resumes.slice(0, 3)}
            emptyMessage="No resumes created."
            renderItem={(resume) => (
              <div key={resume.id} className="stack-item">
                <div>
                  <strong>{resume.title}</strong>
                  <div className="text-muted small">
                    {formatSkillNames(resume.skills || []).slice(0, 3).join(', ') || 'No skills saved'}
                  </div>
                </div>
                <Link to="/resumes">View</Link>
              </div>
            )}
          />
        </div>
        <div className="col-lg-6">
          <DashboardListPanel
            title="Interviews"
            items={dashboard.interviews.slice(0, 3)}
            emptyMessage="No interview sessions yet."
            renderItem={(session) => (
              <div key={session.id} className="stack-item">
                <div>
                  <strong>{session.title || session.type}</strong>
                  <div className="text-muted small">{session.type}</div>
                </div>
                <span className="badge bg-primary-subtle text-primary">{session.status}</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
