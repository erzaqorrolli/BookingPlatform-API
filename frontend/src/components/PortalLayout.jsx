import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const menuItems = [
  {
    label: 'My bookings',
    path: '/portal',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'New booking',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/portal/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function PortalLayout({ children }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-emerald-500/30">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:min-h-16 flex flex-wrap items-center justify-between gap-y-2 py-2 md:flex-nowrap md:py-0">
          
          {/* Logo */}
          <Link to="/portal" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">My Space</span>
          </Link>

          {/* Menu links */}
          <div className="order-3 flex w-full items-center justify-around gap-1 border-t border-white/5 pt-2 text-xs font-medium text-white/60 sm:text-sm md:order-none md:w-auto md:justify-center md:gap-4 md:border-0 md:pt-0 lg:gap-8">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-11 rounded-lg px-2 py-2 text-center transition sm:px-3 ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="relative ml-auto">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="flex min-h-10 items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/5 sm:gap-3 sm:px-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden max-w-32 text-left sm:block">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              </div>
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div role="menu" className="absolute right-0 mt-2 w-[min(14rem,calc(100vw-2rem))] bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-white/40 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto min-w-0 max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-white/30 sm:px-6 sm:py-8">
          © {new Date().getFullYear()} {settings?.company_name || 'BookWise'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}