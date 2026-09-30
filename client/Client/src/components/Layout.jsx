import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiBriefcase, FiGrid, FiLogOut, FiMessageSquare, FiUser, FiFileText, FiBarChart2, FiCalendar, FiBookmark, FiSend, FiMenu, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import CoachWidget from './CoachWidget';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/profile', label: 'Career profile', icon: FiUser },
  { to: '/resumes', label: 'Resumes', icon: FiFileText },
  { to: '/jobs', label: 'Find jobs', icon: FiBriefcase },
  { to: '/applications', label: 'Applications', icon: FiSend },
  { to: '/saved-jobs', label: 'Saved jobs', icon: FiBookmark },
  { to: '/skills', label: 'Skills', icon: FiBarChart2 },
  { to: '/interviews', label: 'Interviews', icon: FiCalendar },
  { to: '/ai', label: 'AI Coach', icon: FiMessageSquare },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('careerpilot_sidebar_collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 600px)').matches) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((current) => {
      localStorage.setItem('careerpilot_sidebar_collapsed', String(!current));
      return !current;
    });
  };

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-nav-open' : ''}`}>
      <aside className="sidebar" id="primary-navigation">
        <div className="brand-wrap">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-title">CareerPilot</div>
            <small>Career workspace</small>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar-circle">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div>
              <strong>{user?.name || 'User'}</strong>
              {user?.email ? <small>{user.email}</small> : null}
            </div>
          </div>
          <button type="button" className="logout-button" onClick={() => logout()}>
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <div className="topbar">
          <button type="button" className="sidebar-toggle" onClick={toggleSidebar} aria-label={mobileOpen ? 'Close navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={mobileOpen} aria-controls="primary-navigation">
            {mobileOpen ? <FiChevronLeft /> : <FiMenu />}<span>{mobileOpen ? 'Close' : 'Menu'}</span>
          </button>
          <div>
            <div className="eyebrow">Career management</div>
            <h1>Professional growth workspace</h1>
          </div>
        </div>
        <Outlet />
      </main>
      <CoachWidget />
    </div>
  );
}
