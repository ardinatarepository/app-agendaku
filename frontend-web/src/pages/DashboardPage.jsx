import { 
  MdAssignment, 
  MdFlashOn, 
  MdCheckCircle, 
  MdError, 
  MdTimeline,
  MdChevronRight
} from 'react-icons/md';
import { useDashboard, useTasks, useUpdateTask, useToggleSubtask, useCreateSubtask } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/tasks/TaskCard';

// ── Bold & Solid Stat Card ──────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white p-8 rounded-[2rem] flex items-center gap-6 shadow-premium border border-slate-100 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 active:scale-95 text-left group"
  >
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-12" style={{ backgroundColor: `${color}10`, color }}>
      {icon}
    </div>
    <div>
      <p className="text-4xl font-medium text-slate-800 leading-none">{value}</p>
      <p className="text-xs font-normal text-slate-400 uppercase tracking-[0.2em] mt-2">{label}</p>
    </div>
  </button>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const updateTask = useUpdateTask();
  const { data, isLoading } = useDashboard();
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();

  const handleStatusChange = async (id, status) => {
    await updateTask.mutateAsync({ id, data: { status } });
  };
  
  const handleToggleSubtask = (taskId, subtaskId) => toggleSubtask.mutateAsync({ taskId, subtaskId });
  const handleAddSubtask = (taskId, title) => createSubtask.mutateAsync({ taskId, data: { title } });

  const { data: allTasks = [] } = useTasks({});

  const stats = data?.stats || { total: 0, sedangDikerjakan: 0, selesai: 0, terlewat: 0 };
  const completionRate = stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tugasHariIni = allTasks.filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
    return dl.getTime() === today.getTime();
  });

  const tugasDeadline = (allTasks || []).filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline);
    const now = new Date();
    const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
    return dl >= now && dl <= threeDays;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const tugasTerlewat = (allTasks || []).filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    return new Date(t.deadline) < new Date();
  }).sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

  if (isLoading) return <div className="p-20 text-center font-bold text-slate-400 animate-pulse uppercase tracking-[0.5em]">SISTEM MEMUAT...</div>;

  return (
    <div className="min-h-screen bg-[#fbfcfd] pb-24">
      
      {/* Header — Solid & Professional */}
      <div className="bg-[#15152b] text-white px-8 py-12 sm:px-12 lg:px-16 border-b border-white/5 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Halo, {user?.name}</h1>
          <p className="text-white/40 text-base font-medium">Selamat datang kembali di AgendaKu. Mari selesaikan tugasmu.</p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-32 -mt-32" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 mt-10 relative z-20">
        
        {/* Stats Grid — Filling the Width with Bold Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard label="Total Tugas"   value={stats.total}            color="#1e293b" icon={<MdAssignment size={32} />} onClick={() => navigate('/tasks')} />
          <StatCard label="Berjalan"      value={stats.sedangDikerjakan} color="#3b82f6" icon={<MdFlashOn size={32} />}    onClick={() => navigate('/tasks?status=SEDANG_DIKERJAKAN')} />
          <StatCard label="Selesai"       value={stats.selesai}          color="#10b981" icon={<MdCheckCircle size={32} />} onClick={() => navigate('/tasks?status=SELESAI')} />
          <StatCard label="Terlewat"      value={stats.terlewat}         color="#ef4444" icon={<MdError size={32} />}       onClick={() => navigate('/tasks?status=TERLEWAT')} />
        </div>

        {/* Productivity Bar — Thick & Solid Widget */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-premium border border-slate-100 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-4">
              <MdTimeline size={28} className="text-primary" /> Progress Produktivitas
            </h3>
            <div className="flex items-baseline gap-1 text-primary">
              <span className="text-4xl font-semibold">{completionRate}</span>
              <span className="text-xl font-semibold">%</span>
            </div>
          </div>
          <div className="border-b border-slate-100 mb-8" />
          <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
            <div 
              className="h-full bg-[#15152b] rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-center text-sm font-normal text-slate-400 mt-8 italic">
             {stats.total > 0 
               ? `Fokus! Anda telah menyelesaikan ${stats.selesai} dari ${stats.total} tugas. Teruskan perjuanganmu!`
               : 'Mulai langkah pertamamu hari ini dengan membuat agenda tugas baru.'}
          </p>
        </div>

        {/* Overdue Warning — Consistent with Mobile Urgency */}
        {tugasTerlewat.length > 0 && (
          <div className="mb-12 animate-pulse-subtle">
            <div className="bg-red-50 border-2 border-red-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-red-600 flex items-center gap-3">
                  <MdError size={28} /> Peringatan: Tugas Terlewat
                </h2>
                <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  {tugasTerlewat.length} Urgent
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tugasTerlewat.slice(0, 4).map(task => (
                  <div key={task.id} className="bg-white/60 p-4 rounded-2xl flex items-center gap-4 border border-red-50">
                    <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{task.title}</p>
                      <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                        Terlambat sejak: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task Sections — Robust Full-Width Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Tugas Hari Ini */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-4">
                <div className="w-1.5 h-6 bg-[#15152b] rounded-full" /> Tugas Hari Ini
              </h2>
              <button onClick={() => navigate('/tasks')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                Lihat Semua
              </button>
            </div>
            <div className="border-b border-slate-100 mb-8" />

            {tugasHariIni.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-28 text-center shadow-sm">
                <MdAssignment size={64} className="text-slate-100 mx-auto mb-6" />
                <p className="text-lg font-medium text-slate-300 uppercase tracking-widest">Tidak ada tugas hari ini</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tugasHariIni.map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} />
                ))}
              </div>
            )}
          </section>

          {/* Mendekati Deadline */}
          <section className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-4">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" /> Mendekati Deadline
              </h2>
              <button onClick={() => navigate('/tasks')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                Lihat Semua
              </button>
            </div>
            <div className="border-b border-slate-100 mb-8" />

            {tugasDeadline.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-28 text-center shadow-sm">
                <MdCheckCircle size={64} className="text-slate-100 mx-auto mb-6" />
                <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">Semua deadline aman</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tugasDeadline.map(task => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
