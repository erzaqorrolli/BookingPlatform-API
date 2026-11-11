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
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/portal" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight">My Space</span>
          </Link>

          {/* Menu links (desktop) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`transition ${
                    active ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 hover:bg-white/5 rounded-xl px-3 py-2 transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
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
                <div className="absolute right-0 mt-2 w-56 bg-[#0d0d14] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-white/40 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* FOOTER I THJESHTË */}
      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} {settings?.company_name || 'BookWise'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}