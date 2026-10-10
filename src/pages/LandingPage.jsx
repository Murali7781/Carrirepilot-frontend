import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiMessageSquare,
  FiTarget,
  FiTrendingUp,
} from 'react-icons/fi';

const workflowCards = [
  {
    id: 'resume',
    title: 'Resume Builder & Analysis',
    value: '01',
    tag: 'Resume workspace',
    description: 'Build and review your resume',
    accent: 'green',
    items: ['Create editable sections', 'Review resume content', 'Compare with a target role'],
  },
  {
    id: 'skill',
    title: 'Skill Gap Analysis',
    value: '02',
    tag: 'Role requirements',
    description: 'See skills to strengthen',
    accent: 'mint',
    items: ['Compare skills with a role', 'Review evidence from your resume', 'Choose a next learning step'],
  },
  {
    id: 'next-steps',
    title: 'Career Overview',
    value: '03',
    tag: 'Suggested next steps',
    description: 'Keep your search moving',
    accent: 'amber',
    items: ['See a suggested next action', 'Review application activity', 'Check workspace readiness'],
  },
  {
    id: 'interview',
    title: 'Interview Preparation',
    value: '04',
    tag: 'Practice sessions',
    description: 'Prepare for role interviews',
    accent: 'purple',
    items: ['Practice structured questions', 'Review your responses', 'Keep feedback with the session'],
  },
  {
    id: 'jobs',
    title: 'Job Discovery',
    value: '05',
    tag: 'Roles and applications',
    description: 'Organize your job search',
    accent: 'green',
    items: ['Explore available roles', 'Save opportunities', 'Track application progress'],
  },
];

const highlightMetrics = [
  { label: 'Resume tools', value: '01', delta: 'Build and review' },
  { label: 'Role matching', value: '02', delta: 'Compare your skills' },
  { label: 'Career overview', value: '03', delta: 'Choose a next step' },
  { label: 'Interview practice', value: '04', delta: 'Prepare with feedback' },
  { label: 'Job tracking', value: '05', delta: 'Save and follow up' },
];

const trustedSignals = [
  'Resume analysis',
  'Skill gaps',
  'Career next steps',
  'Interview prep',
  'Job matching',
  'Career growth',
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="landing-brand" aria-label="CareerPilot home">
          <span className="landing-brand-mark">C</span>
          <span className="landing-brand-text">CareerPilot</span>
        </div>

        <nav className="landing-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <a href="#workflow">Workflow</a>
          <a href="#highlights">Highlights</a>
          <a href="#features">Modules</a>
        </nav>

        <div className="landing-header-actions">
          <Link to="/login" className="landing-secondary-btn">Sign in</Link>
          <Link to="/register" className="landing-primary-btn">Create account <FiArrowRight /></Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <h1>Your Career Journey, Connected</h1>
            <p>
              Bring your resume, job search, interview practice, and next steps together.
            </p>
          </div>

          <div className="landing-sparkline-wrap" aria-hidden="true">
            <div className="landing-sparkline-note">
              <span className="landing-sparkline-icon">
                <FiTrendingUp />
              </span>
              <div>
                <strong>One platform.</strong>
                <span>Every step.</span>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="landing-workflow" aria-label="Career workflow overview">
          {workflowCards.map((card, index) => (
            <article key={card.id} className={`landing-card landing-card-${card.accent}`}>
              <div className="landing-card-topline">
                <span className="landing-card-index">{index + 1}</span>
                <h3>{card.title}</h3>
              </div>

              <div className="landing-metric-row">
                <div className="landing-mini-ring landing-mini-ring-neutral" style={{ '--progress': '0%' }}>
                  <span>{card.value}</span>
                </div>
                <div className="landing-card-content">
                  <div className="landing-card-profile">
                    <span className="landing-card-avatar">{card.tag[0]}</span>
                    <div>
                      <strong>{card.tag}</strong>
                      <small>{card.description}</small>
                    </div>
                  </div>
                </div>
              </div>

              <ul className="landing-card-list">
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="landing-preview-bar" aria-label="CareerPilot product overview">
          <div>
            <span className="landing-preview-pill">CareerPilot</span>
            <div className="landing-preview-copy">
              <strong>Make your next career move.</strong>
              <span>Sign in to continue with your career workspace.</span>
            </div>
          </div>

          <div className="landing-preview-actions">
            <Link to="/login" className="landing-secondary-btn">
              Sign in
            </Link>
            <Link to="/register" className="landing-primary-btn">
              Create account <FiArrowRight />
            </Link>
          </div>
        </section>

        <section id="highlights" className="landing-feature-strip" aria-label="CareerPilot features">
          {highlightMetrics.map((metric) => (
            <div key={metric.label} className="landing-metric-tile">
              <span>{metric.value}</span>
              <small>{metric.label}</small>
              <strong>{metric.delta}</strong>
            </div>
          ))}
        </section>

        <section id="features" className="landing-bottom-grid">
          <div className="landing-side-cta">
            <div className="landing-side-cta-header">
              <div className="landing-mini-brand">
                <span className="landing-brand-mark">C</span>
                <span>CareerPilot</span>
              </div>
              <span className="landing-card-tag">Your career workspace</span>
            </div>

            <ul className="landing-trust-list">
              {trustedSignals.map((signal) => (
                <li key={signal}><FiCheckCircle /> {signal}</li>
              ))}
            </ul>
          </div>

          <div className="landing-product-card">
            <div className="landing-product-header">
              <div>
                <span className="landing-card-tag">Connected workflow</span>
                <h3>Career intelligence built around one profile.</h3>
              </div>
              <Link to="/register" className="landing-link-btn">
                Get started <FiArrowRight />
              </Link>
            </div>

            <div className="landing-product-grid">
              <div className="landing-product-box">
                <FiFileText />
                <span>Resume Analysis</span>
              </div>
              <div className="landing-product-box">
                <FiBriefcase />
                <span>Job Matching</span>
              </div>
              <div className="landing-product-box">
                <FiTarget />
                <span>Skill Gap</span>
              </div>
              <div className="landing-product-box">
                <FiMessageSquare />
                <span>Mock Interview</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
