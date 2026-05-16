import { 
  IoPlayOutline, 
  IoCheckmarkCircleOutline, 
  IoTimeOutline, 
  IoListOutline, 
  IoChevronForward,
  IoCalendarOutline,
  IoCheckmark
} from 'react-icons/io5';
import { useDashboard, useTasks } from '../hooks';
import { AVATAR_BASE_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const StatCard = ({ label, value, onClick, variant, icon }) => (
  <button
    onClick={onClick}
    className={`p-5 rounded-[18px] flex flex-col justify-center h-[100px] shadow-sm border border-slate-100/50 hover:shadow-md transition-all duration-300 active:scale-95 text-left relative group w-full ${variant}`}
  >
    <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
    <p className="text-3xl font-bold leading-tight">{value}</p>
    <p className="text-[11px] font-bold uppercase tracking-[0.15em] opacity-60 mt-1">{label}</p>
  </button>
);

const MilestoneProgress = ({ stats }) => {
  const total = stats.total || 0;
  const selesai = stats.selesai || 0;
  const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const steps = [
    { id: 1, label: 'BAGUS', threshold: 25 },
    { id: 2, label: 'KEREN', threshold: 50 },
    { id: 3, label: 'RAJIN', threshold: 100 },
  ];

  const getLatestCompletedId = (p) => {
    if (p >= 100) return 3;
    if (p >= 50) return 2;
    if (p >= 25) return 1;
    return null;
  };

  const latestId = getLatestCompletedId(percent);

  return (
    <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
        <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Progres Belajar</h2>
        <div className="bg-slate-50 px-3 py-1 rounded-full">
          <span className="text-[12px] font-bold text-slate-400">{selesai}/{total}</span>
        </div>
      </div>
      
      <div className="px-8 pt-20 pb-10 flex flex-col items-center">
        <div className="relative w-full max-w-[400px] h-1 flex items-center">
          <div className="milestone-line" />
          <div className="milestone-fill" style={{ width: `${percent}%` }} />

          {steps.map((step) => {
            const isDone = percent >= step.threshold;
            const isLatest = latestId === step.id;

            return (
              <div key={step.id} className="absolute top-0" style={{ left: `${step.threshold}%` }}>
                {isLatest && (
                  <div className="absolute bottom-10 -translate-x-1/2 flex flex-col items-center animate-fade-in">
                    <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest">
                      {step.label}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-900 mt-[-1px]" />
                  </div>
                )}
                <div className={`milestone-node ${isDone ? 'milestone-node-active' : 'milestone-node-future'}`}>
                  {isDone ? <IoCheckmark size={14} className="text-black" /> : null}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-10 text-[13px] font-bold text-slate-400">
          {percent}% selesai — {total - selesai} tugas tersisa
        </p>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const { data: allTasks = [] } = useTasks({});

  const stats = data?.stats || { total: 0, sedangDikerjakan: 0, selesai: 0, terlewat: 0 };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tasks = allTasks || [];
  
  const tugasHariIni = tasks.filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
    return dl.getTime() === today.getTime();
  });

  const tugasDeadline = tasks.filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline);
    const now = new Date();
    const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
    return dl >= now && dl <= threeDays;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const tugasTerlewat = tasks.filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline);
    return dl < new Date();
  }).sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  if (isLoading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em] text-xs">SISTEM MEMUAT...</div>;

  const goToTasks = (filter = {}) => {
    const params = new URLSearchParams(filter).toString();
    navigate(`/tasks?${params}`);
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pb-24 font-poppins">
      
      {/* Header (Top Bar) — EXACT MOBILE PARITY */}
      <div className="bg-white px-8 pt-16 pb-8 sm:px-12 lg:px-16 shadow-sm relative z-30 flex items-center justify-between">
        <div className="max-w-[1200px] mx-auto flex-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 tracking-[0.15em] mb-1">SELAMAT DATANG</p>
            <h1 className="text-4xl font-bold text-black tracking-tighter">Halo, {user?.name?.split(' ')[0]}</h1>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-12 h-12 rounded-full bg-slate-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-primary text-lg font-bold"
          >
            {user?.avatar ? (
              <img src={`${AVATAR_BASE_URL}${user.avatar}?t=${new Date().getTime()}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : user?.name?.[0]?.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 mt-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="BERJALAN" 
            value={stats.sedangDikerjakan} 
            variant="stat-card-berjalan" 
            icon={<IoPlayOutline size={22} />} 
            onClick={() => goToTasks({ status: 'SEDANG_DIKERJAKAN' })} 
          />
          <StatCard 
            label="SELESAI" 
            value={stats.selesai} 
            variant="stat-card-selesai" 
            icon={<IoCheckmarkCircleOutline size={22} />} 
            onClick={() => goToTasks({ status: 'SELESAI' })} 
          />
          <StatCard 
            label="TERLEWAT" 
            value={stats.terlewat} 
            variant="stat-card-terlewat" 
            icon={<IoTimeOutline size={22} />} 
            onClick={() => goToTasks({ status: 'TERLEWAT' })} 
          />
          <StatCard 
            label="TOTAL" 
            value={stats.total} 
            variant="stat-card-total" 
            icon={<IoListOutline size={22} />} 
            onClick={() => goToTasks({})} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Tugas Terlewat */}
            {tugasTerlewat.length > 0 && (
              <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Tugas Terlewat</h2>
                  <IoChevronForward size={18} className="text-slate-400" />
                </div>
                <div className="divide-y divide-slate-50">
                  {tugasTerlewat.slice(0, 3).map(task => (
                    <button key={task.id} onClick={() => navigate(`/tasks?status=TERLEWAT&highlightId=${task.id}`)} className="w-full flex items-center gap-4 px-6 py-5 hover:bg-red-50/30 transition-colors text-left group">
                      <div className="w-1 h-8 bg-red-500 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-[15px] truncate group-hover:text-red-600 transition-colors">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <IoCalendarOutline size={12} className="text-slate-400" />
                          <p className="text-[12px] font-medium text-slate-400">
                            {format(new Date(task.deadline), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mendekati Deadline */}
            <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Mendekati Deadline</h2>
                <IoChevronForward size={18} className="text-slate-400" />
              </div>
              <div className="divide-y divide-slate-50">
                {tugasDeadline.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-slate-400">
                    <IoCheckmarkCircleOutline size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Semua deadline aman</p>
                  </div>
                ) : (
                  tugasDeadline.slice(0, 3).map(task => (
                    <button key={task.id} onClick={() => navigate(`/tasks?status=SEDANG_DIKERJAKAN&highlightId=${task.id}`)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                        <p className="font-bold text-slate-800 text-[15px] truncate group-hover:text-black transition-colors">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-[#FACC15] px-3 py-1.5 rounded-lg">
                          <p className="text-[11px] font-black text-black">Segera</p>
                        </div>
                        <p className="text-[14px] font-black text-slate-400">
                          {format(new Date(task.deadline), 'HH:mm')}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Agenda Hari Ini */}
            <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Agenda Hari Ini</h2>
                <IoChevronForward size={18} className="text-slate-400" />
              </div>
              <div className="divide-y divide-slate-50">
                {tugasHariIni.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-slate-400">
                    <IoCalendarOutline size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Tidak ada agenda</p>
                  </div>
                ) : (
                  tugasHariIni.slice(0, 3).map(task => (
                    <button key={task.id} onClick={() => navigate(`/tasks?status=SEDANG_DIKERJAKAN&highlightId=${task.id}`)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                        <p className="font-bold text-slate-800 text-[15px] truncate group-hover:text-black transition-colors">{task.title}</p>
                      </div>
                      <p className="text-[14px] font-black text-red-500">Hari ini</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Progress Belajar */}
            <MilestoneProgress stats={stats} />
          </div>
        </div>

      </div>
    </div>
  );
}
