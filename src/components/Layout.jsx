import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiActivity, FiBarChart2, FiBriefcase, FiChevronLeft, FiChevronRight, FiFileText, FiGrid, FiLogOut, FiMenu, FiSend, FiTarget, FiUser, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import CoachWidget from './CoachWidget';

const sections = [
  { label: 'WORKSPACE', links: [{ to: '/dashboard', label: 'Dashboard', icon: FiGrid }] },
  { label: 'CAREER TOOLS', links: [
    { to: '/resumes', label: 'Resumes', icon: FiFileText },
    { to: '/jobs', label: 'Find roles', icon: FiBriefcase },
    { to: '/saved-jobs', label: 'Saved roles', icon: FiTarget },
    { to: '/applications', label: 'Applications', icon: FiSend },
    { to: '/skills', label: 'Skills', icon: FiBarChart2 },
    { to: '/interviews', label: 'Interview practice', icon: FiActivity },
  ] },
];

const pageTitles = {
  '/dashboard': ['Career overview', 'A clear view of your job search and next steps.'],
  '/profile': ['Career profile', 'Your goals, preferences, and contact details.'],
  '/resumes': ['Resume builder', 'Create and refine a resume one section at a time.'],
  '/jobs': ['Find roles', 'Explore opportunities that fit your goals.'],
  '/applications': ['Applications', 'Keep follow-ups and progress in one place.'],
  '/saved-jobs': ['Saved roles', 'Your shortlist of opportunities.'],
  '/skills': ['Skills', 'Focus your learning on relevant skills.'],
  '/interviews': ['Interview practice', 'Prepare with structured practice.'],
};

function getInitialCollapsedState() {
  try { return localStorage.getItem('careerpilot_sidebar_collapsed') === 'true'; } catch { return false; }
}

function getInitials(name) {
  return String(name || 'Account').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'A';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = String(user?.role || '').toLowerCase();
  const canViewCareerWorkspace = ['candidate', 'admin'].includes(role);
  const visibleSections = canViewCareerWorkspace ? sections : role === 'recruiter' ? [{ label: 'RECRUITER WORKSPACE', links: [{ to: '/jobs', label: 'My job postings', icon: FiBriefcase }] }] : [];
  const [collapsed, setCollapsed] = useState(getInitialCollapsedState);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const titleInfo = role === 'recruiter' && location.pathname === '/jobs' ? ['My job postings', 'Create and manage postings saved to your account.'] : pageTitles[location.pathname] || (location.pathname.startsWith('/interviews/') ? ['Practice session', 'Work through questions and review your feedback.'] : ['Career workspace', 'Your career tools, together.']);
  const [pageTitle, pageSubtitle] = titleInfo;

  useEffect(() => {
    const closeMobileNavigation = () => setMobileOpen(false);
    window.addEventListener('popstate', closeMobileNavigation);
    return () => window.removeEventListener('popstate', closeMobileNavigation);
  }, []);

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 700px)').matches) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((value) => {
      const next = !value;
      try { localStorage.setItem('careerpilot_sidebar_collapsed', String(next)); } catch { /* Keep the toggle usable when storage is unavailable. */ }
      return next;
    });
  };

  const handleLogout = async () => {
    setSigningOut(true);
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(getApiErrorMessage(error, 'Unable to sign out. Check your connection and try again.'));
      setSigningOut(false);
    }
  };

  return <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-nav-open' : ''}`}>
    {mobileOpen ? <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}
    <aside className="sidebar" id="primary-navigation" aria-label="CareerPilot navigation">
      <div className="brand-wrap"><span className="brand-mark">C</span><span className="brand-title">CareerPilot<small>CAREER WORKSPACE</small></span></div>
      <button type="button" className="sidebar-toggle-edge" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-controls="primary-navigation" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><span className="sidebar-toggle-desktop-icon">{collapsed ? <FiChevronRight /> : <FiChevronLeft />}</span><span className="sidebar-toggle-mobile-icon">{mobileOpen ? <FiX /> : <FiMenu />}</span></button>
      <nav className="nav-menu" aria-label="Main navigation">
        {visibleSections.map((section) => <div className="nav-section" key={section.label}><span className="nav-section-label">{section.label}</span>{section.links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span></NavLink>)}</div>)}
        <div className="nav-section nav-profile-section"><span className="nav-section-label">ACCOUNT</span><NavLink to="/profile" title={collapsed ? 'Career profile' : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><FiUser size={17} /><span>Career profile</span></NavLink></div>
      </nav>
      <div className="sidebar-footer">{logoutError ? <p className="alert alert-danger" role="alert">{logoutError}</p> : null}<button type="button" className="logout-button" onClick={handleLogout} disabled={signingOut}><FiLogOut size={16} /><span>{signingOut ? 'Signing out…' : 'Sign out'}</span></button></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><button type="button" className="sidebar-toggle-mobile-trigger" onClick={toggleSidebar} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-controls="primary-navigation" aria-expanded={mobileOpen}>{mobileOpen ? <FiX /> : <FiMenu />}</button><div className="topbar-copy"><span>CAREERPILOT / WORKSPACE</span><h1>{pageTitle}</h1><p>{pageSubtitle}</p></div><Link to="/profile" className="topbar-account" aria-label="Open your career profile"><span className="topbar-avatar">{getInitials(user?.name)}</span><span className="topbar-account-copy"><strong>{user?.name || 'Your account'}</strong><small>Career profile</small></span><FiUser className="topbar-account-icon" /></Link></header>
      <Outlet />
      {canViewCareerWorkspace ? <CoachWidget /> : null}
    </main>
  </div>;
}
