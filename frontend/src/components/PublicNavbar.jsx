import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useRole } from '../hooks/useRole';

const navigationLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function PublicNavbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const role = useRole();
  const { pathname } = useLocation();

  const isClient = role === 'customer' || role === 'guest';
  const accountPath = isClient
    ? '/portal'
    : role === 'staff'
      ? '/staff'
      : role === 'superadmin'
        ? '/admin/superadmin'
        : '/admin';

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="truncate font-bold text-sm tracking-tight sm:text-base">{settings.platform_name}</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          {navigationLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              aria-current={pathname === path ? 'page' : undefined}
              className={pathname === path ? 'text-white font-medium' : 'hover:text-white transition'}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link to={accountPath} className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 sm:px-4 sm:text-sm">
                {isClient ? 'My bookings' : 'Dashboard'}
              </Link>
              <button onClick={logout} className="min-h-11 px-1 text-xs text-white/60 transition hover:text-white sm:px-0 sm:text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="min-h-11 px-1 flex items-center text-xs text-white/60 transition hover:text-white sm:px-0 sm:text-sm">
                Login
              </Link>
              <Link to="/register-business" className="rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 sm:px-4 sm:text-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 border-t border-white/5 px-4 py-2 text-sm text-white/60 md:hidden">
        {navigationLinks.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            aria-current={pathname === path ? 'page' : undefined}
            className={`min-h-10 flex items-center ${pathname === path ? 'text-white' : 'hover:text-white'}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
