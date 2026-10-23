import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { ChevronDown, Check, Building2, MessageCircle } from 'lucide-react'; 
import { usePermissions } from '../contexts/PermissionsContext';

const menuItems = [
  {
    label: 'My day',
    path: '/staff',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'My schedule',
    path: '/staff/schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Holidays',
    path: '/staff/holidays',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    path: '/staff/bookings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Chat',
    path: '/staff/chat',
    icon: <MessageCircle className="w-5 h-5" />,
    permission: 'staff_can_send_emails',
  },
  {
    label: 'Profile',
    path: '/staff/profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  
  {
    label: 'My Role',
    path: '/staff/my-role',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  
];

export default function StaffLayout({ children }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false); 
  
  const workspaceRef = useRef(null); 
  const userMenuRef = useRef(null);

  const { user, logout } = useAuth();
  const { activeCompany, companies, switchCompany } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions(); 

  useEffect(() => {
    function handleClickOutside(event) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
        setWorkspaceMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; 
    return hasPermission(item.permission); 
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <Link to="/staff" className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
            
            <div className="relative flex flex-col justify-center" ref={workspaceRef}>
              <span className="font-bold text-slate-900 text-sm leading-tight">Staff Portal</span>
              
              {companies.length > 1 ? (
                <>
                  <button
                    onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-orange-600 transition-colors -mt-0.5 outline-none"
                  >
                    <Building2 className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{activeCompany?.name}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${workspaceMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {workspaceMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 pb-1.5 mb-1 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspaces</p>
                      </div>
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            switchCompany(c.id);
                            setWorkspaceMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                            activeCompany?.id === c.id 
                              ? 'bg-orange-50 text-orange-700 font-medium' 
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          {activeCompany?.id === c.id && <Check className="w-4 h-4 text-orange-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                activeCompany && (
                  <span className="text-xs text-slate-500 -mt-0.5">{activeCompany.name}</span>
                )
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {visibleMenuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition ${
                    active ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 hover:bg-slate-100 rounded-lg px-3 py-2 transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>


            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/staff/profile"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
                
              </div>      
            )}
          </div>
        </div>
      </nav>

      <div className="md:hidden bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 px-4 py-2">
          {visibleMenuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}