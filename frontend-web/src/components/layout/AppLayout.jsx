import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MdLogout,
  MdNotificationsNone
} from 'react-icons/md';

import Logo from '../common/Logo';
import ConfirmModal from '../ui/ConfirmModal';

const NAV = [
  { to: '/',           icon: 'https://cdn-icons-png.flaticon.com/512/9440/9440315.png',   label: 'Dashboard' },
  { to: '/tasks',      icon: 'https://cdn-icons-png.flaticon.com/512/6831/6831818.png',   label: 'Tugas'     },
  { to: '/calendar',   icon: 'https://cdn-icons-png.flaticon.com/512/10156/10156100.png', label: 'Kalender'  },
  { to: '/profile',    icon: 'https://cdn-icons-png.flaticon.com/512/9131/9131549.png',   label: 'Profil'    },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-poppins">

      {/* ══ SIDEBAR (Desktop) ══ */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 relative z-20">
        <div className="pl-6 pr-8 pt-[74px] pb-10">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 px-4 space-y-2 pt-10">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive ? 'bg-[#F8FAFC]' : 'hover:bg-slate-50/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isActive ? 'bg-white shadow-sm text-[#1E1E1E]' : 'text-slate-300 group-hover:text-slate-400'
                  }`}>
                    <div 
                      style={{ 
                        maskImage: `url(${icon})`, 
                        WebkitMaskImage: `url(${icon})` 
                      }}
                      className="w-[26px] h-[26px] mask-icon bg-current"
                    />
                  </div>
                  <span className={`text-base font-bold tracking-tight flex-1 ${isActive ? 'text-[#1E1E1E]' : 'text-slate-300'}`}>
                    {label}
                  </span>
                  {isActive && <div className="w-1.5 h-1.5 bg-[#1E1E1E] rounded-full" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-4 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:bg-white group-hover:shadow-sm">
              <MdLogout size={22} />
            </div>
            <span className="text-sm font-bold tracking-tight">Keluar</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* Mobile Top Bar */}
        <header className="md:hidden h-16 bg-white border-b border-slate-50 flex items-center justify-between px-6 shrink-0 z-30">
          <Logo size="sm" />
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <MdNotificationsNone size={22} />
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 no-scrollbar">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-50 flex z-40 safe-area-bottom px-4">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-4 transition-all duration-150 relative ${
                  isActive ? 'text-[#1E1E1E]' : 'text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                    <div 
                      style={{ 
                        maskImage: `url(${icon})`, 
                        WebkitMaskImage: `url(${icon})` 
                      }}
                      className="w-[26px] h-[26px] mask-icon bg-current"
                    />
                  </span>
                  <span className={`text-[11px] font-bold ${isActive ? 'text-[#1E1E1E]' : 'text-slate-300'}`}>
                    {label}
                  </span>
                  {isActive && <div className="absolute top-0 w-8 h-1 bg-[#1E1E1E] rounded-b-full shadow-premium" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Keluar Akun?"
        message="Apakah Anda yakin ingin keluar dari akun Anda?"
        confirmText="Keluar"
        cancelText="Batal"
        variant="primary"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
