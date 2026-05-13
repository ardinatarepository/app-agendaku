import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MdHome, 
  MdAssignment, 
  MdEvent, 
  MdCategory, 
  MdPerson, 
  MdLogout,
  MdChevronRight,
  MdDashboard
} from 'react-icons/md';

const NAV = [
  { to: '/',           icon: <MdHome size={24} />,         label: 'Dashboard' },
  { to: '/tasks',      icon: <MdAssignment size={24} />,   label: 'Tugas'     },
  { to: '/calendar',   icon: <MdEvent size={24} />,        label: 'Kalender'  },
  { to: '/profile',    icon: <MdPerson size={24} />,       label: 'Profil'    },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar?')) { logout(); navigate('/login'); }
  };

  const pageTitle = NAV.find(n => n.to === location.pathname)?.label ?? 'AgendaKu';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ══ SIDEBAR (Desktop) ══ */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-[#1e293b] border-r border-slate-100 shadow-sm relative z-20">
        <div className="px-6 py-8 flex items-center gap-3">
          <img src="/logo.png" alt="AgendaKu Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
          <span className="text-xl font-black text-[#1e293b] tracking-tighter">AgendaKu</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 group ${
                  isActive ? 'text-[#1e293b] bg-slate-50' : 'text-[#94a3b8] hover:text-[#1e293b] hover:bg-slate-50/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-[#e2e8f0]' : 'group-hover:bg-[#f1f5f9]'
                  }`}>
                    {icon}
                  </div>
                  <span className="flex-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div className="flex items-center gap-3 mb-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#1e293b] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg shadow-black/10">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#1e293b] truncate leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-bold">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-2 text-[10px] font-black text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-300">
              Keluar Akun
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-40 safe-area-bottom">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 transition-all duration-150 ${
                  isActive ? 'text-[#1e293b]' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-xl transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>{icon}</span>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-[#1e293b]' : 'text-slate-400'}`}>{label}</span>
                  {isActive && <div className="absolute bottom-0 w-8 h-0.5 bg-[#1e293b] rounded-full" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
