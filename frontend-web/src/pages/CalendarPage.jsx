import { useState, useMemo } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleSubtask, useCreateSubtask, useCategories } from '../hooks';
import { 
  IoChevronBack, 
  IoChevronForward, 
  IoAdd,
  IoFileTrayOutline
} from 'react-icons/io5';
import TaskForm from '../components/tasks/TaskForm';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

// Task Mini Card (Mobile Parity)
const TaskMiniCard = ({ task, onClick }) => {
  const statusCfg = {
    SEDANG_DIKERJAKAN: { label: 'BERJALAN', color: '#059669', bg: '#ecfdf5', bar: '#10b981' },
    SELESAI: { label: 'SELESAI', color: '#059669', bg: '#ecfdf5', bar: '#10b981' },
    TERLEWAT: { label: 'TERLEWAT', color: '#dc2626', bg: '#fef2f2', bar: '#ef4444' },
  }[task.status] || { label: 'BERJALAN', color: '#059669', bg: '#ecfdf5', bar: '#10b981' };

  const prioritySymbol = { TINGGI: 'T', NORMAL: 'N', RENDAH: 'R' }[task.priority || 'NORMAL'];
  const priorityColor = { TINGGI: '#fee2e2', NORMAL: '#fef3c7', RENDAH: '#f1f5f9' };
  const priorityText = { TINGGI: '#dc2626', NORMAL: '#b45309', RENDAH: '#475569' };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex cursor-pointer hover:border-[#FACC15] transition-all group active:scale-[0.98]"
    >
      <div className="w-1 self-stretch rounded-l-[24px]" style={{ backgroundColor: statusCfg.bar }} />
      <div className="p-5 flex-1">
        <h4 className="text-[16px] font-bold text-black line-clamp-1 mb-2.5 tracking-tight">{task.title}</h4>
        <div className="flex items-center gap-2">
          <div 
            className="px-3 py-1 rounded-md text-[10px] font-bold tracking-wider"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </div>
          
          <div 
            className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: priorityColor[task.priority || 'NORMAL'], color: priorityText[task.priority || 'NORMAL'] }}
          >
            {prioritySymbol}
          </div>

          {task.category && (
            <div 
              className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: `${task.category.color}15`, color: task.category.color }}
            >
              {task.category.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskMiniSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 h-20 flex animate-pulse">
    <div className="w-1 bg-slate-100" />
    <div className="p-4 flex-1 space-y-3">
      <div className="w-1/2 h-4 bg-slate-100 rounded" />
      <div className="flex gap-2">
        <div className="w-16 h-4 bg-slate-100 rounded" />
        <div className="w-5 h-5 bg-slate-100 rounded-full" />
      </div>
    </div>
  </div>
);

export default function CalendarPage() {
  const [curr, setCurr] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const { data: tasks = [], isLoading } = useTasks({ all: 'true' });
  const { data: categories = [] } = useCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const handleEdit = (task) => { setEditTask(task); setShowForm(true); };
  const handleSubmit = async (data) => {
    if (editTask && editTask.id) await updateTask.mutateAsync({ id: editTask.id, data });
    else await createTask.mutateAsync(data);
    setShowForm(false); setEditTask(null);
  };

  const goToday = () => {
    const now = new Date();
    setCurr(now);
    setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const year  = curr.getFullYear();
  const month = curr.getMonth();

  const taskDates = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.deadline) return;
      const d = t.deadline.substring(0, 10);
      if (!map[d]) map[d] = { count: 0, hasTinggi: false };
      map[d].count++;
      if (t.priority === 'TINGGI') map[d].hasTinggi = true;
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    return tasks.filter(t => t.deadline && t.deadline.substring(0, 10) === selectedDate);
  }, [tasks, selectedDate]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const cells       = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setCurr(new Date(year, month - 1, 1));
  const nextMonth = () => setCurr(new Date(year, month + 1, 1));

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const selectedLabel = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  })();

  return (
    <div className="w-full min-h-screen bg-[var(--app-bg)] pb-24 pt-4 font-poppins animate-fade-in">
      <div className="max-w-[1000px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Calendar Section */}
          <div className="lg:col-span-6 space-y-6">
            {/* Month Nav */}
            <div className="flex items-center justify-between px-2 mt-2">
              <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-black hover:bg-slate-50 transition-all shadow-sm active:scale-90">
                <IoChevronBack size={20} />
              </button>
              
              <div className="text-center cursor-pointer group" onClick={goToday}>
                <h2 className="text-[17px] font-black text-black leading-tight">{MONTHS[month]} {year}</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest group-hover:text-[#FACC15] transition-colors">Ketuk untuk hari ini</p>
              </div>

              <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-black hover:bg-slate-50 transition-all shadow-sm active:scale-90">
                <IoChevronForward size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-[28px] p-8 shadow-sm border border-slate-100">
              <div className="grid grid-cols-7 gap-1 text-center mb-6">
                {DAYS.map(d => (
                  <div key={d} className="py-2 text-[11px] font-black text-slate-300 uppercase tracking-widest">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-3">
                {cells.map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} className="aspect-square" />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const isSel   = dateStr === selectedDate;
                  const taskInfo = taskDates[dateStr];

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(dateStr)}
                      className="relative aspect-square flex flex-col items-center justify-center group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isSel ? 'bg-[#FACC15] text-black shadow-lg shadow-[#FACC15]/20 scale-110' : 
                        isToday ? 'bg-[#FEF9C3] text-black font-black' : 
                        'text-slate-700 hover:bg-slate-50'
                      }`}>
                        <span className={`text-[13px] ${isSel || isToday ? 'font-black' : 'font-bold'}`}>{d}</span>
                      </div>
                      
                      {taskInfo && (
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${taskInfo.hasTinggi ? 'bg-red-500' : 'bg-[#FACC15]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-10 pt-8 border-t border-slate-50 flex justify-center gap-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Prioritas tinggi</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#FACC15] shadow-sm shadow-[#FACC15]/20" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Ada tugas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agenda Section */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h3 className="text-[15px] font-black text-black tracking-tight uppercase">Tugas — {selectedLabel}</h3>
                <p className="text-[12px] font-bold text-slate-400 tracking-tight">{selectedTasks.length} tugas ditemukan</p>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <TaskMiniSkeleton key={i} />)}
                </div>
              ) : selectedTasks.length === 0 ? (
                <div className="bg-white rounded-[28px] p-24 text-center border border-slate-100 shadow-sm flex flex-col items-center animate-fade-in">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <IoFileTrayOutline size={42} className="text-slate-200" />
                  </div>
                  <p className="text-[14px] font-black text-black uppercase tracking-widest">Tidak ada tugas</p>
                  <p className="text-[12px] font-bold text-slate-400 mt-2 max-w-[200px] mx-auto">Anda belum memiliki agenda tugas pada tanggal ini.</p>
                  <button 
                    onClick={() => { setEditTask({ deadline: selectedDate }); setShowForm(true); }}
                    className="mt-8 px-8 py-3 bg-[#FACC15] text-black text-[13px] font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-[#FACC15]/20"
                  >
                    + Tambah Tugas
                  </button>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  {selectedTasks.map(task => (
                    <TaskMiniCard key={task.id} task={task} onClick={() => handleEdit(task)} />
                  ))}
                  <button 
                    onClick={() => { setEditTask({ deadline: selectedDate }); setShowForm(true); }}
                    className="w-full py-4 rounded-2xl border-[1.5px] border-dashed border-[#FACC15] text-[#FACC15] font-black text-[13px] hover:bg-[#FACC15]/5 transition-all flex items-center justify-center gap-2 group"
                  >
                    <div className="w-5 h-5 bg-[#FACC15] rounded-full flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                      <IoAdd size={16} />
                    </div>
                    <span>Tambah Tugas di tanggal ini</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {showForm && (
        <TaskForm
          task={editTask}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      )}
    </div>
  );
}
