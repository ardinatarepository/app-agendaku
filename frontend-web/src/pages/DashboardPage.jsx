import { 
  IoPlay, 
  IoCheckmarkCircle, 
  IoTime, 
  IoList, 
  IoChevronForward,
  IoCalendarOutline,
  IoCheckmark,
  IoCheckmarkCircleOutline
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
    <p className="text-[30px] font-archivo leading-none">{value}</p>
    <p className="text-[10px] font-archivo tracking-[0.1em] opacity-60 mt-2">{label}</p>
  </button>
);

const MilestoneProgress = ({ stats }) => {
  const total = stats.total || 0;
  const selesai = stats.selesai || 0;
  const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const steps = [
    { id: 1, label: 'Bagus', threshold: 25 },
    { id: 2, label: 'Keren', threshold: 50 },
    { id: 3, label: 'Rajin', threshold: 100 },
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
                    <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-wide">
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
    if (t.status === 'SELESAI' || t.status === 'TERLEWAT' || !t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
    return dl.getTime() === today.getTime();
  });

  const tugasDeadline = tasks.filter(t => {
    if (t.status === 'SELESAI' || t.status === 'TERLEWAT' || !t.deadline) return false;
    const dl = new Date(t.deadline);
    const now = new Date();
    const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
    return dl >= now && dl <= threeDays;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Tugas Terlewat: gunakan data dari dashboard API (sudah benar dari server)
  const tugasTerlewat = (data?.tugasTerlewat || []).sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  const tugasAkanDatang = tasks.filter(t => {
    if (t.status === 'SELESAI' || t.status === 'TERLEWAT' || !t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
    const tom = new Date(today); tom.setDate(tom.getDate() + 1);
    return dl.getTime() >= tom.getTime();
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (isLoading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.5em] text-xs">SISTEM MEMUAT...</div>;

  const goToTasks = (filter = {}) => {
    const params = new URLSearchParams(filter).toString();
    navigate(`/tasks?${params}`);
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pb-24 font-poppins">
      
      {/* Header (Top Bar) — EXACT MOBILE PARITY */}
      <div className="bg-white px-8 pt-16 pb-8 sm:px-12 lg:px-16 shadow-sm relative z-30 flex items-center justify-between">
        <div className="max-w-[1650px] 2xl:max-w-[1850px] mx-auto flex-1 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide mb-1">Selamat Datang</p>
            <h1 className="text-[32px] font-bold text-black tracking-tight mt-1.5 leading-none">Halo, {user?.name?.split(' ')[0]}</h1>
          </div>
          <button 
            onClick={() => navigate('/dashboard/profile')}
            className="w-[60px] h-[60px] rounded-[18px] bg-[#FACC15] border-2 border-white shadow-premium overflow-hidden flex items-center justify-center text-black text-2xl font-black transition-all hover:scale-105 active:scale-95 relative"
          >
            <span className="absolute">{user?.name?.[0]?.toUpperCase()}</span>
            {user?.avatar && (
              <img 
                src={`${AVATAR_BASE_URL}${user.avatar}?t=${new Date().getTime()}`} 
                alt="Avatar" 
                className="w-full h-full object-cover absolute top-0 left-0 z-10"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-[1650px] 2xl:max-w-[1850px] mx-auto px-6 sm:px-8 lg:px-12 mt-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Berjalan" 
            value={stats.sedangDikerjakan} 
            variant="stat-card-berjalan" 
            icon={<IoPlay size={22} />} 
            onClick={() => goToTasks({ status: 'SEDANG_DIKERJAKAN' })} 
          />
          <StatCard 
            label="Selesai" 
            value={stats.selesai} 
            variant="stat-card-selesai" 
            icon={<IoCheckmarkCircle size={22} />} 
            onClick={() => goToTasks({ status: 'SELESAI' })} 
          />
          <StatCard 
            label="Terlewat" 
            value={stats.terlewat} 
            variant="stat-card-terlewat" 
            icon={<IoTime size={22} />} 
            onClick={() => goToTasks({ status: 'TERLEWAT' })} 
          />
          <StatCard 
            label="Total" 
            value={stats.total} 
            variant="stat-card-total" 
            icon={<IoList size={22} />} 
            onClick={() => goToTasks({})} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Tugas Terlewat */}
            {tugasTerlewat.length > 0 && (
              <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
                <div 
                  role="button"
                  onClick={() => navigate('/dashboard/tasks?status=TERLEWAT')}
                  className="px-6 py-5 border-b border-slate-50 flex justify-between items-center cursor-pointer hover:bg-red-50/30 transition-colors group"
                >
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight group-hover:text-red-600 transition-colors">Tugas Terlewat</h2>
                  <IoChevronForward size={18} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                </div>
                <div className="divide-y divide-slate-50">
                  {tugasTerlewat.slice(0, 3).map(task => (
                    <div key={task.id} role="button" onClick={() => navigate(`/tasks?status=TERLEWAT&highlightId=${task.id}`)} className="w-full flex items-center gap-4 px-6 py-5 hover:bg-red-50/30 transition-colors text-left group cursor-pointer">
                      <div className="w-1 h-8 bg-red-500 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-[15px] truncate group-hover:text-red-600 transition-colors">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <IoCalendarOutline size={12} className="text-slate-400" />
                          <p className="text-[12px] font-medium text-slate-400">
                            {format(new Date(task.deadline), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mendekati Deadline */}
            <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
              <div
                role="button"
                onClick={() => navigate('/dashboard/tasks?status=SEDANG_DIKERJAKAN')}
                className="px-6 py-5 border-b border-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight group-hover:text-black transition-colors">Mendekati Deadline</h2>
                <IoChevronForward size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="divide-y divide-slate-50">
                {tugasDeadline.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-slate-400">
                    <IoCheckmarkCircleOutline size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold text-slate-400 tracking-wider">Semua deadline aman</p>
                  </div>
                ) : (
                  tugasDeadline.slice(0, 3).map(task => (
                    <div key={task.id} role="button" onClick={() => navigate(`/dashboard/tasks?status=SEDANG_DIKERJAKAN&highlightId=${task.id}`)} className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-8">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                        <p className="font-medium text-slate-800 text-[15px] truncate group-hover:text-black transition-colors">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-[#FACC15] px-3 py-1.5 rounded-lg">
                          <p className="text-[11px] font-black text-black">Segera</p>
                        </div>
                        <p className="text-[14px] font-black text-slate-400">
                          {format(new Date(task.deadline), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tugas yang Akan Datang */}
            <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
              <div
                role="button"
                onClick={() => navigate('/dashboard/tasks?status=SEDANG_DIKERJAKAN')}
                className="px-6 py-5 border-b border-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight group-hover:text-black transition-colors">Mendatang</h2>
                <IoChevronForward size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="divide-y divide-slate-50">
                {tugasAkanDatang.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-slate-400">
                    <IoCalendarOutline size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold text-slate-400 tracking-wider">Tidak ada tugas mendatang</p>
                  </div>
                ) : (
                  tugasAkanDatang.slice(0, 3).map(task => (
                    <div key={task.id} role="button" onClick={() => navigate(`/dashboard/tasks?status=SEDANG_DIKERJAKAN&highlightId=${task.id}`)} className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-8">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                        <p className="font-medium text-slate-800 text-[15px] truncate group-hover:text-black transition-colors">{task.title}</p>
                      </div>
                      <p className="text-[12px] font-semibold text-slate-400">
                        {format(new Date(task.deadline), 'dd MMM')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Agenda Hari Ini */}
            <div className="bg-white rounded-[18px] shadow-premium border border-slate-50 overflow-hidden">
              <div
                role="button"
                onClick={() => navigate('/dashboard/tasks?status=SEDANG_DIKERJAKAN')}
                className="px-6 py-5 border-b border-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors group"
              >
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight group-hover:text-black transition-colors">Agenda Hari Ini</h2>
                <IoChevronForward size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="divide-y divide-slate-50">
                {tugasHariIni.length === 0 ? (
                  <div className="py-12 flex flex-col items-center text-slate-400">
                    <IoCalendarOutline size={32} className="mb-2 opacity-20" />
                    <p className="text-xs font-bold text-slate-400 tracking-wider">Tidak ada agenda</p>
                  </div>
                ) : (
                  tugasHariIni.slice(0, 3).map(task => (
                    <div key={task.id} role="button" onClick={() => navigate(`/dashboard/tasks?status=SEDANG_DIKERJAKAN&highlightId=${task.id}`)} className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-8">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                        <p className="font-medium text-slate-800 text-[15px] truncate group-hover:text-black transition-colors">{task.title}</p>
                      </div>
                      <p className="text-[14px] font-black text-red-500">Hari ini</p>
                    </div>
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
