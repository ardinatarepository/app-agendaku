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
import ConfirmModal from '../components/ui/ConfirmModal';
import { 
  IoSearchOutline, 
  IoOptionsOutline, 
  IoAdd,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoListOutline,
  IoSunnyOutline,
  IoCalendarClearOutline,
  IoDocumentTextOutline,
  IoFileTrayOutline
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

  const handleEdit = (task) => { setEditTask(task); setShowForm(true); };
  const handleDelete = (id) => {
    setConfirmDeleteTask(id);
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

  // Grouping Logic
  const groupedTasks = useMemo(() => {
    const groups = [
      { id: 'overdue', l: 'Terlewat', i: <IoTimeOutline size={18} className="text-red-500" />, items: [] },
      { id: 'today', l: 'Hari Ini', i: <IoSunnyOutline size={18} className="text-black" />, items: [] },
      { id: 'tomorrow', l: 'Besok', i: <IoCalendarOutline size={18} className="text-slate-500" />, items: [] },
      { id: 'upcoming', l: 'Mendatang', i: <IoCalendarClearOutline size={18} className="text-slate-500" />, items: [] },
      { id: 'nodl', l: 'Tugas Lainnya', i: <IoDocumentTextOutline size={18} className="text-slate-500" />, items: [] },
      { id: 'done', l: 'Selesai', i: <IoCheckmarkCircleOutline size={18} className="text-emerald-500" />, items: [] }
    ];

    tasks.forEach(t => {
      if (t.status === 'SELESAI') { groups[5].items.push(t); return; }
      if (!t.deadline) { groups[4].items.push(t); return; }
      
      const now = new Date(); now.setHours(0,0,0,0);
      const tmr = new Date(); tmr.setDate(tmr.getDate() + 1); tmr.setHours(0,0,0,0);
      const taskDate = new Date(t.deadline); taskDate.setHours(0,0,0,0);

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
      <div className="px-8 pt-8 pb-6 sm:px-12 lg:px-16 relative z-30">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-5">
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" size={20} />
              <input
                className="w-full pl-12 pr-4 h-14 bg-white border border-slate-200 rounded-[24px] text-[15px] font-medium shadow-sm focus:ring-4 focus:ring-[#FACC15]/10 outline-none transition-all placeholder:text-slate-300"
                placeholder="Cari tugas..."
                value={filters.search}
                onChange={(e) => setFilter('search')(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${
                showFilterPanel || filterCount > 0 
                ? 'bg-black text-[#FACC15] border-black' 
                : 'bg-white text-slate-400 border-slate-200 shadow-sm'
              }`}
            >
              <IoOptionsOutline size={24} />
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
                  className={`px-5 h-9 rounded-full text-[13px] font-bold tracking-tight whitespace-nowrap transition-all border ${
                    active 
                    ? 'shadow-sm' 
                    : 'bg-white text-slate-400 border-slate-200'
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

      <div className="p-8 max-w-[1200px] mx-auto">
        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white rounded-[24px] p-6 shadow-xl border border-slate-100 mb-10 animate-fade-in">
             <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-black text-[15px] tracking-tight">URUTAN & FILTER</h3>
              <button onClick={() => setFilters({ status: '', priority: '', categoryId: '', search: '' })} className="text-[13px] font-bold text-slate-400 hover:text-red-500 transition-colors">Reset Filter</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-[12px] font-black text-slate-400 mb-4 tracking-widest">URUTKAN</p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'terbaru', l: 'Terbaru', i: <IoTimeOutline size={18} /> },
                    { id: 'deadline', l: 'Deadline', i: <IoCalendarOutline size={18} /> },
                    { id: 'prioritas', l: 'Prioritas', i: <IoListOutline size={18} /> },
                  ].map(o => (
                    <button key={o.id} onClick={() => setSortBy(o.id)} className={`px-5 py-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${sortBy === o.id ? 'bg-black text-[#FACC15] border-black' : 'bg-white border-slate-200 text-slate-400'}`}>
                      {o.i} {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-bold text-slate-400 mb-4 tracking-widest">KATEGORI</p>
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={() => setFilter('categoryId')('')} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border ${!filters.categoryId ? 'bg-black text-[#FACC15] border-black' : 'bg-white border-slate-200 text-slate-400'}`}>Semua</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setFilter('categoryId')(String(c.id))} className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all`} style={{ backgroundColor: filters.categoryId === String(c.id) ? `${c.color}15` : 'white', borderColor: filters.categoryId === String(c.id) ? c.color : '#E5E7EB', color: filters.categoryId === String(c.id) ? c.color : '#6B7280' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {isLoading ? (
          <div className="space-y-12">
            {[1,2].map(s => (
              <div key={s} className="space-y-6">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
                   <div className="w-40 h-5 bg-slate-200 rounded animate-pulse" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[1,2,3].map(i => <TaskSkeleton key={i} />)}
                 </div>
              </div>
            ))}
          </div>
        ) : groupedTasks.length === 0 ? (
          <div className="bg-white rounded-[28px] p-24 text-center shadow-sm border border-slate-100 flex flex-col items-center animate-fade-in">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <IoFileTrayOutline size={48} className="text-slate-200" />
            </div>
            <p className="font-bold text-black text-2xl tracking-tighter">Tidak ada tugas</p>
            <p className="text-[14px] text-slate-400 mt-4 font-medium max-w-xs mx-auto leading-relaxed">{filters.search || filterCount ? 'Coba ubah filter atau pencarian Anda.' : 'Ketuk tombol + di bawah untuk mulai membuat tugas!'}</p>
          </div>
        ) : (
          <div className="space-y-14">
            {groupedTasks.map(group => (
              <div key={group.id} className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">{group.i}</div>
                  <h2 className="text-[16px] font-bold text-slate-800 tracking-tight capitalize">{group.l}</h2>
                  <div className="bg-[#F1F5F9] px-2.5 py-0.5 rounded-lg ml-1">
                    <span className="text-[12px] font-bold text-[#64748B]">{group.items.length}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map(task => (
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
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditTask(null); setShowForm(true); }}
        className="fixed bottom-10 right-10 w-16 h-16 bg-[#FACC15] text-black rounded-[20px] shadow-2xl shadow-[#FACC15]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <IoAdd size={36} />
      </button>

      {showForm && (
        <TaskForm task={editTask} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditTask(null); }} isLoading={createTask.isPending || updateTask.isPending} />
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
    </div>
  );
}
