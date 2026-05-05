import { 
  MdAssignment, 
  MdFlashOn, 
  MdCheckCircle, 
  MdError, 
  MdArrowForward,
  MdStar,
  MdWarning,
  MdEvent,
  MdChevronRight,
  MdAccessTime,
  MdAutoAwesome,
  MdCheck,
  MdHome,
  MdSchedule,
  MdPriorityHigh,
  MdSortByAlpha,
  MdTimeline
} from 'react-icons/md';
import { useDashboard, useTasks, useUpdateTask, useCreateTask, useToggleSubtask, useCreateSubtask } from '../hooks';
import { formatDate, isOverdue } from '../utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/tasks/TaskCard';

// ── Stat Card (klik → filter tugas) ──────────────────────────────────────────
const StatCard = ({ label, value, color, icon, iconName, onClick }) => (
  <button
    onClick={onClick}
    className="card p-5 text-center flex flex-col items-center justify-center hover:shadow-premium-hover transition-all duration-300 active:scale-95 group bg-white"
    style={{ borderTop: `4px solid ${color.startsWith('#') ? color : ''}`, borderTopColor: !color.startsWith('#') ? undefined : color }}
  >
    <div className={`mb-3 transition-transform duration-300 group-hover:scale-110`} style={{ color: color.startsWith('text-') ? undefined : color }}>
       {/* If color is a tailwind class like text-blue-600, we let tailwind handle it, otherwise use style */}
       <span className={color.startsWith('text-') ? color : ''}>{icon}</span>
    </div>
    <p className={`text-2xl font-black mb-1 ${color.startsWith('text-') ? color : ''}`} style={{ color: color.startsWith('text-') ? undefined : color }}>{value}</p>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
  </button>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateTask = useUpdateTask();
  const { data, isLoading } = useDashboard();

  const handleStatusChange = async (id, status) => {
    await updateTask.mutateAsync({ id, data: { status } });
  };
  
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();

  const handleToggleSubtask = (taskId, subtaskId) => toggleSubtask.mutateAsync({ taskId, subtaskId });
  const handleAddSubtask = (taskId, title) => createSubtask.mutateAsync({ taskId, data: { title } });

  const { data: allTasks = [] } = useTasks({});

  const stats         = data?.stats || { total: 0, sedangDikerjakan: 0, selesai: 0, terlewat: 0 };
  
  // Mendekati deadline: hari ini sampai 3 hari ke depan
  const tugasDeadline = (allTasks || []).filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline);
    const now = new Date();
    const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
    return dl >= now && dl <= threeDays;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const tugasTerlewat = data?.tugasTerlewat || [];

  // Tugas hari ini
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tugasHariIni = allTasks.filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
    return dl.getTime() === today.getTime();
  });

  if (isLoading) return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 sm:h-28" />)}
      </div>
    </div>
  );

  return (
    <div className="w-full pb-10">

      {/* Header (Top Bar ala Mobile) - FULL WIDTH */}
      <div className="bg-[#15152b] text-white px-6 pt-8 pb-10 sm:px-10 sm:pt-10 sm:pb-10 lg:px-12 lg:pt-12 lg:pb-12 rounded-b-[30px] mb-8 shadow-md flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 leading-tight text-white">Halo, {user?.name?.split(' ')[0]}</h1>
          <p className="text-white/60 text-sm sm:text-lg font-medium leading-relaxed">
            Selamat datang kembali di AgendaKu
          </p>
        </div>
        
        {/* Avatar Area */}
        <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-2 border-white/30 overflow-hidden shrink-0 shadow-lg">
          {user?.avatar ? (
            <img src={`${import.meta.env.VITE_API_URL}/avatars/${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full -ml-16 -mb-16 blur-2xl" />
      </div>

      {/* Content Area with Padding and Max Width */}
      <div className="px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto">
        
        {/* Stats — 2 col mobile, 4 col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total"      value={stats.total            ?? 0} color="#1e293b" icon={<MdAssignment size={26} />}  onClick={() => navigate('/tasks')} />
          <StatCard label="Dikerjakan" value={stats.sedangDikerjakan ?? 0} color="#15152b" icon={<MdFlashOn size={26} />}     onClick={() => navigate('/tasks?status=SEDANG_DIKERJAKAN')} />
          <StatCard label="Selesai"    value={stats.selesai          ?? 0} color="#10b981" icon={<MdCheckCircle size={26} />}  onClick={() => navigate('/tasks?status=SELESAI')} />
          <StatCard label="Terlewat"   value={stats.terlewat         ?? 0} color="#ef4444" icon={<MdError size={26} />}        onClick={() => navigate('/tasks?status=TERLEWAT')} />
        </div>

      {/* ⚠ Peringatan Tugas Terlewat (Matching mobile) */}
      {tugasTerlewat.length > 0 && (
        <div className="mb-8 animate-slide-in">
          <h2 className="font-black text-red-600 text-base sm:text-lg mb-4 flex items-center gap-2">
            <MdError size={22} /> Peringatan: Tugas Terlewat
          </h2>
          <div className="space-y-3">
            {tugasTerlewat.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} />
            ))}
          </div>
        </div>
      )}

      {/* Progress Section (Matching mobile Image 2) */}
      <div className="mb-8">
        <h2 className="font-black text-[#1e293b] text-base sm:text-lg mb-4">Progress Tugas</h2>
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-6 shadow-sm">
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-4">
            <div className="h-2.5 w-full bg-[#f1f5f9] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#059669] transition-all duration-1000 ease-out"
                style={{ width: `${stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs font-bold text-[#475569]">
              {stats.selesai ?? 0} dari {stats.total ?? 0} tugas selesai ({stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0}%)
            </p>
          </div>
          
          <div className="pt-4 border-t border-[#f1f5f9] flex items-center gap-3">
             <div className="text-[#1e293b]"><MdTimeline size={20} /></div>
             <p className="text-xs font-medium text-[#475569]">
                {stats?.total > 0 
                  ? `Kamu sudah menyelesaikan ${Math.round((stats.selesai / stats.total) * 100)}% tugas. Semangat!` 
                  : 'Mulai kerjakan tugasmu hari ini!'}
             </p>
          </div>
        </div>
      </div>



      {/* ── Tugas Hari Ini ── */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-[#1e293b] text-base sm:text-lg">
            Agenda hari ini
          </h2>
          <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e2e8f0] text-[#1e293b] text-[10px] font-black rounded-full hover:bg-[#cbd5e1] transition-all">
            Lihat Semua <MdChevronRight size={16} />
          </button>
        </div>

        {tugasHariIni.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-[2rem] p-10 sm:p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <MdAutoAwesome size={32} className="text-[#1e293b]" />
            </div>
            <p className="font-semibold text-[#1e293b] text-[15px]">Tidak ada tugas hari ini</p>
            <p className="text-[13px] text-[#64748b] mt-1.5 leading-relaxed">Tambah tugas baru atau cek daftar lengkap</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tugasHariIni.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} />
            ))}
          </div>
        )}
      </div>

      {/* ── Mendekati Deadline ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-[#1e293b] text-base sm:text-lg">
            Mendekati Deadline
          </h2>
          <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e2e8f0] text-[#1e293b] text-[10px] font-black rounded-full hover:bg-[#cbd5e1] transition-all">
            Lihat Semua <MdChevronRight size={16} />
          </button>
        </div>

        {tugasDeadline.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-[2rem] p-10 sm:p-12 text-center shadow-sm">
            <p className="font-semibold text-[#1e293b] text-[15px]">Semua deadline aman!</p>
            <p className="text-[13px] text-[#64748b] mt-1.5 leading-relaxed">Tidak ada tugas mendesak untuk 3 hari ke depan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tugasDeadline.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} />
            ))}
          </div>
        )}
      </div>

      {/* End Content Area */}
      </div>

    </div>
  );
}
