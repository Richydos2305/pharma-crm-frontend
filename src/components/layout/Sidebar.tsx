import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../api/auth';
import { useToast } from '../../context/ToastContext';

// Ordered by visual position — used to pick forward vs backward slide direction
const NAV_ORDER = ['/dashboard', '/patients/new', '/patients/form-builder', '/patients', '/pharmacists', '/profile'];

function navClick(currentPath: string, toPath: string) {
  return (e: React.MouseEvent) => {
    if (currentPath === toPath) {
      e.preventDefault();
      return;
    }
    const fromIdx = NAV_ORDER.findIndex((r) => currentPath.startsWith(r));
    const toIdx = NAV_ORDER.findIndex((r) => toPath.startsWith(r));
    document.documentElement.dataset.navDir = toIdx < fromIdx ? 'backward' : 'forward';
  };
}

interface SidebarProps {
  companyName: string;
  companyInitials: string;
  companyLogo?: string;
}

export function Sidebar({ companyName, companyInitials, companyLogo }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ top: 0, height: 0, visible: false });

  function measurePill() {
    if (!navRef.current) return;
    const active = navRef.current.querySelector('.nav-item.active') as HTMLElement | null;
    if (!active) return;
    setPill({ top: active.offsetTop, height: active.offsetHeight, visible: true });
  }

  useLayoutEffect(() => {
    measurePill();
  }, [location.pathname]);

  function toggleSidebar() {
    setCollapsed((c) => !c);
    document.body.classList.toggle('sidebar-collapsed');
  }

  async function handleSignOut() {
    const refreshToken = localStorage.getItem('refreshToken') ?? '';
    try {
      await logout(refreshToken);
    } catch {
      /* ignore */
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    showToast('Signed out successfully', 'success');
    navigate('/login');
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            companyInitials
          )}
        </div>
        <span className="sidebar-brand-name">{companyName}</span>
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <svg
            className={`sidebar-toggle-icon${collapsed ? ' sidebar-toggle-icon--collapsed' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <div className="sidebar-nav" ref={navRef}>
        <div className="sidebar-pill" style={{ top: pill.top, height: pill.height, opacity: pill.visible ? 1 : 0 }} />

        <NavLink
          to="/dashboard"
          viewTransition
          onClick={navClick(location.pathname, '/dashboard')}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="nav-label" data-label="Dashboard">
            Dashboard
          </span>
        </NavLink>

        <NavLink
          to="/patients"
          end
          viewTransition
          onClick={navClick(location.pathname, '/patients')}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="nav-label" data-label="Patients">
            Patients
          </span>
        </NavLink>

        <NavLink
          to="/patients/new"
          viewTransition
          onClick={navClick(location.pathname, '/patients/new')}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <span className="nav-label" data-label="Create Patient">
            Create Patient
          </span>
        </NavLink>

        <NavLink
          to="/patients/form-builder"
          viewTransition
          onClick={navClick(location.pathname, '/patients/form-builder')}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="12" y2="17" />
          </svg>
          <span className="nav-label" data-label="Form Builder">
            Form Builder
          </span>
        </NavLink>

        <NavLink
          to="/pharmacists"
          viewTransition
          onClick={navClick(location.pathname, '/pharmacists')}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
          </svg>
          <span className="nav-label" data-label="Pharmacists">
            Pharmacists
          </span>
        </NavLink>

        <NavLink
          to="/profile"
          viewTransition
          onClick={navClick(location.pathname, '/profile')}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="nav-label" data-label="My Profile">
            My Profile
          </span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <button className="sign-out-btn" onClick={handleSignOut}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="nav-label">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
