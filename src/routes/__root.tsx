import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';

function ThemeToggle() {
  const { preference, resolved, toggle } = useTheme();
  const next = preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
  const icon = resolved === 'dark' ? '☀' : '☾';
  return (
    <button
      type="button"
      onClick={toggle}
      className="secondary icon-button"
      style={{ fontSize: '1.1rem' }}
      aria-label={`Switch to ${next} theme`}
    >
      {icon}
    </button>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  const state = useRouterState();
  const current = state.location.pathname === to || state.location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      aria-current={current ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

function RecoveryScreen() {
  const { dispatch } = usePlanner();
  return (
    <section className="panel recovery">
      <p className="eyebrow">Recovery needed</p>
      <h1>Your saved data could not be read</h1>
      <p>Form has left the unreadable data untouched. Reset only this planner&apos;s local data to continue.</p>
      <button
        type="button"
        className="danger"
        onClick={() => {
          if (window.confirm('Reset all Form planner data on this device?')) {
            dispatch({ type: 'RESET_DATA' });
          }
        }}
      >
        Reset planner data
      </button>
    </section>
  );
}

function AppShell() {
  const { recoveryError } = usePlanner();
  const [announcement, setAnnouncement] = useState('');
  const announceRef = useRef(setAnnouncement);
  announceRef.current = setAnnouncement;

  useEffect(() => {
    (window as never as Record<string, unknown>).__announce = (msg: string) => {
      setAnnouncement('');
      requestAnimationFrame(() => setAnnouncement(msg));
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link to="/plans" className="brand" aria-label="Form gym planner, Plans">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Form</span>
        </Link>
        <nav aria-label="Primary">
          <NavLink to="/plans" label="Plans" />
          <NavLink to="/session" label="Session" />
          <NavLink to="/history" label="History" />
        </nav>
        <ThemeToggle />
      </header>
      <main id="main-content" tabIndex={-1}>
        <div className="app-content">
          {recoveryError ? <RecoveryScreen /> : <Outlet />}
        </div>
      </main>
      <div
        id="status"
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {announcement}
      </div>
    </>
  );
}

export const Route = createRootRoute({
  component: AppShell,
});
