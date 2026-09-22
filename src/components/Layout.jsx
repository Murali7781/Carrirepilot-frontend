import { NavLink, Outlet } from 'react-router-dom';
import { FiBriefcase, FiGrid, FiLogOut, FiMessageSquare, FiUser, FiFileText, FiBarChart2, FiCalendar, FiBookmark, FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-title">CareerPilot</div>
            <small>Career workspace</small>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
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
              <small>{user?.email || 'career@pilot.com'}</small>
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
          <div>
            <div className="eyebrow">Career management</div>
            <h1>Professional growth workspace</h1>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
