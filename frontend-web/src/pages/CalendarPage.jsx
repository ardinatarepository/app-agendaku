import { useState, useMemo } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleSubtask, useCreateSubtask } from '../hooks';
import { formatDate } from '../utils';
import { 
  MdChevronLeft, 
  MdChevronRight, 
  MdEvent, 
  MdAccessTime, 
  MdError,
  MdMarkunreadMailbox
} from 'react-icons/md';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

export default function CalendarPage() {
  const [curr, setCurr] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);

  // Ambil semua tugas (param all=true agar backend tidak memfilter hanya yang aktif)
  const { data: tasks = [], isLoading } = useTasks({ all: true });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();

  const handleStatusChange = async (id, status) => {
    await updateTask.mutateAsync({ id, data: { status } });
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus tugas ini?')) {
      await deleteTask.mutateAsync(id);
    }
  };

  const handleSubmit = async (data) => {
    if (editTask && editTask.id) {
      await updateTask.mutateAsync({ id: editTask.id, data });
    } else {
      await createTask.mutateAsync(data);
    }
    setShowForm(false);
    setEditTask(null);
  };

  const handleToggleSubtask = (taskId, subtaskId) => toggleSubtask.mutateAsync({ taskId, subtaskId });
  const handleAddSubtask = (taskId, title) => createSubtask.mutateAsync({ taskId, data: { title } });

  const goToday = () => setCurr(new Date());

  const year  = curr.getFullYear();
  const month = curr.getMonth();

  const taskDates = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (!t.deadline) return;
      const d = t.deadline.split('T')[0];
      if (!map[d]) map[d] = { count: 0, hasTinggi: false };
      map[d].count++;
      if (t.priority === 'TINGGI') map[d].hasTinggi = true;
    });
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    return tasks.filter(t => t.deadline?.startsWith(selectedDate));
  }, [tasks, selectedDate]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const cells       = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setCurr(new Date(year, month - 1, 1));
  const nextMonth = () => setCurr(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* ── Month Navigation ── */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all">
            <MdChevronLeft size={32} />
          </button>
          <button onClick={goToday} className="flex flex-col items-center group">
            <span className="font-black text-2xl text-slate-800">{MONTHS[month]} {year}</span>
            <span className="text-xs font-bold text-slate-400 mt-1 group-hover:text-primary transition-colors">Ketuk untuk hari ini</span>
          </button>
          <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all">
            <MdChevronRight size={32} />
          </button>
        </div>

        {/* ── Calendar Card ── */}
        <div className="card p-6 shadow-premium bg-white mb-8">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dStr === todayStr;
              const isSelected = dStr === selectedDate;
              const info = taskDates[dStr];

              return (
                <button
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`relative aspect-square rounded-full flex flex-col items-center justify-center transition-all duration-200 group mx-auto w-10 h-10 sm:w-12 sm:h-12
                    ${isSelected ? 'bg-[#15152b] text-white shadow-lg scale-110 z-10' : 
                      isToday ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-600'}
                  `}
                >
                  <span className="text-sm z-10 font-medium">{day}</span>
                  {info && !isSelected && (
                    <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${info.hasTinggi ? 'bg-red-500' : 'bg-amber-500'}`} />
                  )}
                  {isSelected && info && (
                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Task List Section ── */}
        <div className="mb-4 px-2 flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800">Tugas: {formatDate(selectedDate)}</h2>
          {selectedTasks.length > 0 && (
            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {selectedTasks.length} Tugas
            </span>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}
            </div>
          ) : selectedTasks.length === 0 ? (
            <div className="card p-10 text-center bg-white/50 border-dashed mb-4">
              <p className="font-bold text-slate-500">Tidak ada tugas di tanggal ini.</p>
            </div>
          ) : (
            selectedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={handleEdit}
                onDelete={handleDelete} 
                onStatusChange={handleStatusChange}
                onToggleSubtask={handleToggleSubtask}
                onAddSubtask={handleAddSubtask}
              />
            ))
          )}

          <button 
            onClick={() => { setEditTask({ deadline: selectedDate }); setShowForm(true); }}
            className="w-full py-4 mt-2 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Tambah Tugas
          </button>
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
