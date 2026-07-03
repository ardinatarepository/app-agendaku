import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCategories,
  useToggleSubtask,
  useCreateSubtask,
  useDeleteSubtask
} from '../hooks';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import TaskSidebar from '../components/tasks/TaskSidebar';
import ConfirmModal from '../components/ui/ConfirmModal';
import {
  IoSearchOutline,
  IoOptionsOutline,
  IoAdd,
  IoCalendar,
  IoCheckmarkCircle,
  IoTime,
  IoList,
  IoSunny,
  IoCalendarClear,
  IoDocumentText,
  IoFileTray
} from 'react-icons/io5';

const STATUS_OPTS = [
  { v: '', l: 'Semua', activeBg: '#FACC15', activeText: '#000000', activeBorder: '#FACC15' },
  { v: 'SEDANG_DIKERJAKAN', l: 'Berjalan', activeBg: '#E0F2FE', activeText: '#0284C7', activeBorder: '#0284C7' },
  { v: 'SELESAI', l: 'Selesai', activeBg: '#ECFDF5', activeText: '#10B981', activeBorder: '#10B981' },
  { v: 'TERLEWAT', l: 'Terlewat', activeBg: '#FEE2E2', activeText: '#EF4444', activeBorder: '#EF4444' }
];

const TaskSkeleton = () => (
  <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm animate-pulse space-y-4 h-44">
    <div className="flex justify-between">
      <div className="w-24 h-3 bg-slate-100 rounded" />
      <div className="w-4 h-4 bg-slate-100 rounded-full" />
    </div>
    <div className="w-3/4 h-5 bg-slate-100 rounded" />
    <div className="flex gap-2">
      <div className="w-16 h-4 bg-slate-100 rounded" />
      <div className="w-6 h-6 bg-slate-100 rounded-full" />
    </div>
    <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between">
      <div className="w-20 h-3 bg-slate-100 rounded" />
      <div className="w-16 h-6 bg-slate-100 rounded-lg" />
    </div>
  </div>
);

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    categoryId: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('terbaru');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const [highlightedId, setHighlightedId] = useState(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
  const [confirmUndoTask, setConfirmUndoTask] = useState(null);

  // Sync state with URL params if they change
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const highlightParam = searchParams.get('highlightId');

    if (statusParam !== null && statusParam !== filters.status) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    }

    if (highlightParam) {
      setHighlightedId(highlightParam);
      // Auto scroll after a short delay to ensure DOM is ready
      setTimeout(() => {
        const el = document.getElementById(`task-${highlightParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      // Remove highlight after 2.5 seconds
      setTimeout(() => setHighlightedId(null), 2500);
    }
  }, [searchParams]);

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
  const filterCount = Object.values(filters).filter(Boolean).length;

  const { data: rawTasks = [], isLoading } = useTasks(activeFilters);
  const tasks = useMemo(() => {
    let list = filters.status ? rawTasks : rawTasks.filter(t => t.status !== 'TERLEWAT');

    // Sorting logic
    if (sortBy === 'terbaru') list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'deadline') list = [...list].sort((a, b) => (new Date(a.deadline) || 0) - (new Date(b.deadline) || 0));
    else if (sortBy === 'prioritas') {
      const pMap = { TINGGI: 3, NORMAL: 2, RENDAH: 1 };
      list = [...list].sort((a, b) => (pMap[b.priority] || 0) - (pMap[a.priority] || 0));
    }
    return list;
  }, [rawTasks, filters.status, sortBy]);

  // Find selected task from current list (stays in sync with real-time updates)
  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => String(t.id) === String(selectedTaskId)) || null;
  }, [tasks, selectedTaskId]);

  // Auto-close sidebar if selected task no longer exists (deleted/filtered out)
  useEffect(() => {
    if (selectedTaskId && !selectedTask) {
      setSelectedTaskId(null);
    }
  }, [selectedTask, selectedTaskId]);

  const { data: categories = [] } = useCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();
  const deleteSubtask = useDeleteSubtask();

  const setFilter = (k) => (v) => setFilters(f => ({ ...f, [k]: v }));

  const handleSubmit = async (data) => {
    if (editTask) await updateTask.mutateAsync({ id: editTask.id, data });
    else await createTask.mutateAsync(data);
    setShowForm(false); setEditTask(null);
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setShowForm(true);
  };
  const handleDelete = (id) => {
    setConfirmDeleteTask(id);
    if (String(id) === String(selectedTaskId)) setSelectedTaskId(null);
  };

  const confirmDelete = async () => {
    if (confirmDeleteTask) {
      await deleteTask.mutateAsync(confirmDeleteTask);
      setConfirmDeleteTask(null);
    }
  };

  const handleStatus = async (id, status) => {
    const task = tasks.find(t => t.id === id);
    if (task && task.status === 'SELESAI' && status === 'SEDANG_DIKERJAKAN') {
      setConfirmUndoTask(id);
    } else {
      await updateTask.mutateAsync({ id, data: { status } });
      // If task is completed, automatically redirect filter status tab to Selesai
      if (status === 'SELESAI') {
        setFilters(prev => ({ ...prev, status: 'SELESAI' }));
      }
    }
  };

  const confirmUndo = async () => {
    if (confirmUndoTask) {
      await updateTask.mutateAsync({ id: confirmUndoTask, data: { status: 'SEDANG_DIKERJAKAN' } });
      setConfirmUndoTask(null);
      // Auto focus on running status tab
      setFilters(prev => ({ ...prev, status: 'SEDANG_DIKERJAKAN' }));
    }
  };

  const handleToggleSubtask = (taskId, subtaskId) => toggleSubtask.mutateAsync({ taskId, subtaskId });
  const handleAddSubtask = (taskId, title) => createSubtask.mutateAsync({ taskId, data: { title } });
  const handleDeleteSubtask = (taskId, subtaskId) => deleteSubtask.mutateAsync({ taskId, subtaskId });

  // Desktop sidebar card click (only opens sidebar on lg screens)
  const handleCardClick = (task) => {
    // Only trigger sidebar on desktop (lg: 1024px+)
    if (window.innerWidth < 1024) return;
    setSelectedTaskId(prev => String(prev) === String(task.id) ? null : String(task.id));
  };

  // Grouping Logic
  const groupedTasks = useMemo(() => {
    const groups = [
      { id: 'overdue', l: 'Terlewat', i: <IoTime size={18} className="text-red-500" />, items: [] },
      { id: 'today', l: 'Hari Ini', i: <IoSunny size={18} className="text-black" />, items: [] },
      { id: 'tomorrow', l: 'Besok', i: <IoCalendar size={18} className="text-slate-500" />, items: [] },
      { id: 'upcoming', l: 'Mendatang', i: <IoCalendarClear size={18} className="text-slate-500" />, items: [] },
      { id: 'nodl', l: 'Tugas Lainnya', i: <IoDocumentText size={18} className="text-slate-500" />, items: [] },
      { id: 'done', l: 'Selesai', i: <IoCheckmarkCircle size={18} className="text-emerald-500" />, items: [] }
    ];

    tasks.forEach(t => {
      if (t.status === 'SELESAI') { groups[5].items.push(t); return; }
      if (!t.deadline) { groups[4].items.push(t); return; }

      const now = new Date(); now.setHours(0, 0, 0, 0);
      const tmr = new Date(); tmr.setDate(tmr.getDate() + 1); tmr.setHours(0, 0, 0, 0);
      const taskDate = new Date(t.deadline); taskDate.setHours(0, 0, 0, 0);

      if (taskDate < now) groups[0].items.push(t);
      else if (taskDate.getTime() === now.getTime()) groups[1].items.push(t);
      else if (taskDate.getTime() === tmr.getTime()) groups[2].items.push(t);
      else groups[3].items.push(t);
    });

    return groups.filter(g => g.items.length > 0);
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pb-24 font-poppins">

      {/* Search & Filter Bar — Integrated (No Header) */}
      <div className="px-4 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-6 lg:px-16 relative z-30">
        <div className="max-w-[1650px] 2xl:max-w-[1850px] mx-auto flex flex-col gap-4 sm:gap-5">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] group">
              <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-black transition-colors" size={20} />
              <input
                className="w-full pl-12 pr-4 h-12 sm:h-14 bg-white border-2 border-slate-600 rounded-[24px] text-[15px] font-normal placeholder:font-normal shadow-sm focus:ring-4 focus:ring-[#FACC15]/10 outline-none transition-all placeholder:text-slate-300"
                placeholder="Cari tugas..."
                value={filters.search}
                onChange={(e) => setFilter('search')(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${showFilterPanel || filterCount > 0
                ? 'bg-white text-black border-black'
                : 'bg-white text-slate-800 border-slate-600 shadow-sm'
                }`}
            >
              <IoOptionsOutline size={20} sm:size={24} />
            </button>
            <button
              onClick={() => { setEditTask(null); setShowForm(true); }}
              className="hidden sm:flex px-4 sm:px-6 h-12 sm:h-14 rounded-xl items-center justify-center gap-2 transition-all bg-[#FACC15] text-black border-2 border-black shadow-sm hover:scale-105 active:scale-95 ml-4"
            >
              <IoAdd size={18} sm:size={20} />
              <span className="text-[12px] sm:text-[14px] font-bold">Tambah</span>
            </button>
          </div>

          {/* Status Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {STATUS_OPTS.map(o => {
              const active = filters.status === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setFilter('status')(o.v)}
                  className={`px-4 sm:px-5 h-8 sm:h-9 rounded-full text-[12px] sm:text-[13px] font-bold tracking-tight whitespace-nowrap transition-all border ${active
                    ? 'shadow-sm'
                    : 'bg-white text-slate-400 border-slate-400'
                    }`}
                  style={active ? {
                    backgroundColor: o.activeBg,
                    color: o.activeText,
                    borderColor: o.activeBorder,
                    borderWidth: '1.5px'
                  } : {}}
                >
                  {o.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks Content */}
      <div className="px-4 sm:px-8 lg:px-16 pb-8 sm:pb-12">
        <div className="max-w-[1650px] 2xl:max-w-[1850px] mx-auto">
        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white rounded-[24px] p-4 sm:p-6 shadow-xl border border-slate-100 mb-4 sm:mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-bold text-black text-[18px] sm:text-[20px] tracking-tight">Filter & Urutkan</h3>
              <button onClick={() => setFilters({ status: '', priority: '', categoryId: '', search: '' })} className="text-[12px] sm:text-[13px] font-bold text-slate-400 hover:text-red-500 transition-colors">Reset Semua</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <div>
                <p className="text-[12px] sm:text-[13px] font-bold text-[#475569] mb-3 sm:mb-4">Urutkan Berdasarkan</p>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {[
                    { id: 'terbaru', l: 'Terbaru', i: <IoTime size={16} sm:size={18} /> },
                    { id: 'deadline', l: 'Deadline', i: <IoCalendar size={16} sm:size={18} /> },
                    { id: 'prioritas', l: 'Prioritas', i: <IoList size={16} sm:size={18} /> },
                    { id: 'judul', l: 'Judul A-Z', i: <IoList size={16} sm:size={18} /> },
                  ].map(o => (
                    <button key={o.id} onClick={() => setSortBy(o.id)} className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[11px] sm:text-[14px] font-bold border-[1.5px] transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${sortBy === o.id ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'}`}>
                      {o.i} {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] sm:text-[13px] font-bold text-[#475569] mb-3 sm:mb-4">Kategori</p>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  <button onClick={() => setFilter('categoryId')('')} className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[11px] sm:text-[14px] font-bold border-[1.5px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${!filters.categoryId ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'}`}>
                    Semua
                  </button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setFilter('categoryId')(String(c.id))} className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[11px] sm:text-[14px] font-bold border-[1.5px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${filters.categoryId === String(c.id) ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'}`}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] sm:text-[13px] font-bold text-[#475569] mb-3 sm:mb-4">Status</p>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {[
                    { id: 'SEDANG_DIKERJAKAN', l: 'Berjalan', bg: '#E0F2FE', color: '#0284C7' },
                    { id: 'SELESAI', l: 'Selesai', bg: '#ECFDF5', color: '#10B981' },
                    { id: 'TERLEWAT', l: 'Terlewat', bg: '#FEE2E2', color: '#EF4444' },
                  ].map(s => (
                    <button key={s.id} onClick={() => setFilter('status')(s.id)} className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[11px] sm:text-[14px] font-bold border-[1.5px] whitespace-nowrap ${filters.status === s.id ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] sm:text-[13px] font-bold text-[#475569] mb-3 sm:mb-4">Prioritas</p>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {[
                    { id: 'RENDAH', l: 'Rendah' },
                    { id: 'NORMAL', l: 'Normal' },
                    { id: 'TINGGI', l: 'Tinggi' },
                  ].map(p => (
                    <button key={p.id} onClick={() => setFilter('priority')(p.id)} className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-[12px] sm:rounded-[14px] text-[11px] sm:text-[14px] font-bold border-[1.5px] whitespace-nowrap ${filters.priority === p.id ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'}`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <TaskSkeleton key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-[20px] sm:rounded-[28px] p-12 sm:p-24 text-center shadow-sm border border-slate-100 flex flex-col items-center animate-fade-in">
            <p className="font-bold text-black text-xl sm:text-2xl tracking-tighter">Tidak ada tugas</p>
            <p className="text-[12px] sm:text-[14px] text-slate-400 mt-3 sm:mt-4 font-normal max-w-xs mx-auto leading-relaxed">{filters.search || filterCount ? 'Coba ubah filter atau pencarian Anda.' : 'Ketuk tombol + di bawah untuk mulai membuat tugas!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
            {tasks.map(task => (
              <div
                key={task.id}
                id={`task-${task.id}`}
                className={`transition-all duration-500 rounded-[24px] ${highlightedId === String(task.id) ? 'pulse-highlight' : ''}`}
              >
                <TaskCard
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatus}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onCardClick={handleCardClick}
                  isSelected={String(selectedTaskId) === String(task.id)}
                />
              </div>
            ))}
          </div>
        )}
          </div>{/* max-w container */}
      </div>{/* outer padding */}

      {/* Desktop Sidebar — fixed right overlay */}
          {selectedTask && !showForm && (
            <TaskSidebar
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatus}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

      {showForm && (
        <TaskForm
          task={editTask}
          onSubmit={handleSubmit}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          isLoading={createTask.isPending || updateTask.isPending}
        />
      )}

      {/* Delete Task Confirmation */}
      <ConfirmModal
        visible={!!confirmDeleteTask}
        title="Hapus Tugas?"
        message="Apakah Anda yakin ingin menghapus tugas ini secara permanen dari daftar Anda?"
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteTask(null)}
      />

      {/* Undo Task Confirmation */}
      <ConfirmModal
        visible={!!confirmUndoTask}
        title="Batalkan Selesai?"
        message="Apakah Anda yakin ingin mengembalikan tugas ini ke status 'Berjalan'?"
        confirmText="Ya"
        cancelText="Batal"
        variant="primary"
        onConfirm={confirmUndo}
        onCancel={() => setConfirmUndoTask(null)}
      />

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => { setEditTask(null); setShowForm(true); }}
        className="sm:hidden fixed bottom-24 right-6 w-14 h-14 bg-[#FACC15] text-black border-2 border-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 z-50"
      >
        <IoAdd size={28} />
      </button>
    </div>
  );
}
