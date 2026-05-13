import { useState, useMemo } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useToggleSubtask, useCreateSubtask } from '../hooks';
import { formatDate } from '../utils';
import { 
  MdChevronLeft, 
  MdChevronRight, 
  MdEvent, 
  MdAccessTime, 
  MdError,
  MdMarkunreadMailbox,
  MdAdd,
  MdCalendarMonth
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
    <div className="w-full min-h-screen bg-slate-50 pb-20 pt-10">
      
      <div className="max-w-[1500px] mx-auto px-6 sm:px-8 lg:px-10 relative z-10">
        
        {/* ── Main Grid Layout (Calendar Left, Tasks Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Calendar Widget */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-10 shadow-premium border border-slate-100 min-h-[600px]">
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-12">
                <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-primary transition-all">
                  <MdChevronLeft size={32} />
                </button>
                <button onClick={goToday} className="flex flex-col items-center group">
                  <span className="font-bold text-2xl text-slate-800">{MONTHS[month]} {year}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-primary transition-colors">Hari Ini</span>
                </button>
                <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-primary transition-all">
                  <MdChevronRight size={32} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-4 mb-6">
                {DAYS.map(d => (
                  <div key={d} className="text-[12px] font-bold text-slate-300 uppercase text-center tracking-[0.2em] py-4">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-4">
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
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group w-full max-w-[64px] mx-auto
                        ${isSelected ? 'bg-[#15152b] text-white shadow-xl scale-110 z-10' : 
                          isToday ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-600'}
                      `}
                    >
                      <span className="text-base font-bold z-10">{day}</span>
                      {info && !isSelected && (
                        <div className={`absolute bottom-3 w-2 h-2 rounded-full ${info.hasTinggi ? 'bg-red-500' : 'bg-primary'}`} />
                      )}
                      {isSelected && info && (
                        <div className="absolute bottom-3 w-2 h-2 rounded-full bg-white/50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Task List */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-premium border border-slate-100 min-h-[600px]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{formatDate(selectedDate)}</h2>
                  <div className="h-1.5 w-16 bg-primary rounded-full mt-3" />
                </div>
                {selectedTasks.length > 0 && (
                  <span className="text-sm font-bold bg-[#15152b] text-white px-6 py-2 rounded-full shadow-lg">
                    {selectedTasks.length} Agenda
                  </span>
                )}
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-50 rounded-[2rem] animate-pulse" />)}
                  </div>
                ) : selectedTasks.length === 0 ? (
                  <div className="py-24 text-center border-2 border-dashed border-slate-50 rounded-[3rem]">
                    <MdCalendarMonth size={64} className="text-slate-100 mx-auto mb-6" />
                    <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">Tidak ada agenda untuk tanggal ini</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {selectedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onEdit={handleEdit}
                        onDelete={handleDelete} 
                        onStatusChange={handleStatusChange}
                        onToggleSubtask={handleToggleSubtask}
                        onAddSubtask={handleAddSubtask}
                      />
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => { setEditTask({ deadline: selectedDate }); setShowForm(true); }}
                  className="w-full py-8 mt-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                    <MdAdd size={24} />
                  </div>
                  TAMBAH AGENDA BARU
                </button>
              </div>
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
