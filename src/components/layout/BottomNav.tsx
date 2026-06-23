import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

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

export function BottomNav() {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });

  function measurePill() {
    if (!navRef.current) return;
    const active = navRef.current.querySelector('.bottom-nav-item.active') as HTMLElement | null;
    if (!active) return;
    setPill({ left: active.offsetLeft, width: active.offsetWidth, visible: true });
  }

  useLayoutEffect(() => {
    measurePill();
  }, [location.pathname]);

  // Re-measure when the nav goes from hidden (display:none, desktop) to visible (mobile)
  useLayoutEffect(() => {
    if (!navRef.current) return;
    const observer = new ResizeObserver(() => measurePill());
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="bottom-nav" ref={navRef}>
      <div className="bottom-nav-pill" style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }} />
      <NavLink
        to="/dashboard"
        viewTransition
        onClick={navClick(location.pathname, '/dashboard')}
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        Dashboard
      </NavLink>
      <NavLink
        to="/patients"
        end
        viewTransition
        onClick={navClick(location.pathname, '/patients')}
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Patients
      </NavLink>
      <NavLink
        to="/patients/new"
        viewTransition
        onClick={navClick(location.pathname, '/patients/new')}
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Patient
      </NavLink>
      <NavLink
        to="/pharmacists"
        viewTransition
        onClick={navClick(location.pathname, '/pharmacists')}
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
        Pharmacists
      </NavLink>
      <NavLink
        to="/profile"
        viewTransition
        onClick={navClick(location.pathname, '/profile')}
        className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Profile
      </NavLink>
    </nav>
  );
}
