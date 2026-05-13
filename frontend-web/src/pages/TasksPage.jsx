import { useState, useMemo } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCategories, useToggleSubtask, useCreateSubtask } from '../hooks';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import { 
  MdAdd, 
  MdSearch, 
  MdFilterList, 
  MdSchedule,
  MdEvent,
  MdPriorityHigh,
  MdSortByAlpha,
  MdHistory,
  MdError,
  MdCheck
} from 'react-icons/md';

const STATUS_OPTS   = [{ v: '', l: 'Semua' }, { v: 'SEDANG_DIKERJAKAN', l: 'Sedang Berjalan' }, { v: 'SELESAI', l: 'Selesai' }, { v: 'TERLEWAT', l: 'Terlewat' }];
const PRIORITY_OPTS = [{ v: '', l: 'Semua' }, { v: 'TINGGI', l: 'Tinggi' }, { v: 'NORMAL', l: 'Normal' }, { v: 'RENDAH', l: 'Rendah' }];

export default function TasksPage() {
  const [filters, setFilters]   = useState({ status: '', priority: '', categoryId: '', search: '' });
  const [sortBy, setSortBy]     = useState('terbaru'); // terbaru, deadline, prioritas, judul
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
  const filterCount   = Object.values(filters).filter(Boolean).length;

  const { data: tasks = [], isLoading } = useTasks(activeFilters);
  const { data: categories = [] }       = useCategories();
  const createTask  = useCreateTask();
  const updateTask  = useUpdateTask();
  const deleteTask  = useDeleteTask();
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();

  const setFilter = (k) => (v) => setFilters(f => ({ ...f, [k]: v }));

  const handleSubmit = async (data) => {
    if (editTask) await updateTask.mutateAsync({ id: editTask.id, data });
    else          await createTask.mutateAsync(data);
    setShowForm(false); setEditTask(null);
  };

  const handleEdit   = (task) => { setEditTask(task); setShowForm(true); };
  const handleDelete = async (id) => {
    console.log('Attempting to delete task with ID:', id);
    if (window.confirm('Hapus tugas ini?')) {
      try {
        await deleteTask.mutateAsync(id);
        console.log('Task deleted successfully:', id);
      } catch (err) {
        console.error('Delete mutation failed:', err);
      }
    } else {
      console.log('Delete cancelled by user');
    }
  };
  const handleStatus = async (id, status) => {
    await updateTask.mutateAsync({ id, data: { status } });
    setFilter('status')(status); // Auto pindah ke tab status yang baru
  };
  
  const handleToggleSubtask = (taskId, subtaskId) => toggleSubtask.mutateAsync({ taskId, subtaskId });
  const handleAddSubtask = (taskId, title) => createSubtask.mutateAsync({ taskId, data: { title } });

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Semua Tugas</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{tasks.length} tugas ditemukan</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowForm(true); }} className="btn-primary text-xs sm:text-sm">
          <MdAdd size={20} /> Tambah Tugas
        </button>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            <MdSearch size={22} />
          </span>
          <input
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 shadow-premium transition-all placeholder:text-slate-300"
            placeholder="Cari tugas Anda hari ini..."
            value={filters.search}
            onChange={(e) => setFilter('search')(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilterPanel(s => !s)}
            className={`px-6 py-4 rounded-[1.25rem] border text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-premium ${
              showFilterPanel || filterCount > 0
                ? 'border-primary bg-primary text-white'
                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
          >
            <MdFilterList size={20} />
            Filter
            {filterCount > 0 && (
              <span className="w-5 h-5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
          {filterCount > 0 && (
            <button 
              onClick={() => setFilters({ status: '', priority: '', categoryId: '', search: '' })} 
              className="px-6 py-4 rounded-[1.25rem] bg-slate-100 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center gap-2"
            >
              <MdHistory size={18} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Status chip bar (always visible) */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STATUS_OPTS.map(o => (
          <button key={o.v} onClick={() => setFilter('status')(o.v)}
            className={`filter-chip shrink-0 ${filters.status === o.v ? 'active' : ''}`}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Collapsible filter panel (Matching mobile Screenshot) */}
      {showFilterPanel && (
        <div className="card p-6 mb-6 shadow-premium border-primary/5 animate-slide-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-slate-800">Filter & Urutkan</h3>
            <button onClick={() => setFilters({ status: '', priority: '', categoryId: '', search: '' })} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
              Reset Semua
            </button>
          </div>

          <div className="space-y-6">
            {/* Urutkan Berdasarkan */}
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Urutkan Berdasarkan</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'terbaru', l: 'Terbaru', i: <MdSchedule size={16} /> },
                  { id: 'deadline', l: 'Deadline', i: <MdEvent size={16} /> },
                  { id: 'prioritas', l: 'Prioritas', i: <MdPriorityHigh size={16} /> },
                  { id: 'judul', l: 'Judul A-Z', i: <MdSortByAlpha size={16} /> },
                ].map(o => (
                  <button key={o.id} onClick={() => setSortBy(o.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      sortBy === o.id ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {o.i} {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioritas */}
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Prioritas</p>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTS.map(o => (
                  <button key={o.v} onClick={() => setFilter('priority')(o.v)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      filters.priority === o.v ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-3">Kategori</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter('categoryId')('')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    !filters.categoryId ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                  Semua
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setFilter('categoryId')(c.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      filters.categoryId === c.id ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => setShowFilterPanel(false)} className="btn-primary w-full py-3.5 rounded-2xl font-black tracking-tight">
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task list with Mobile-inspired Grouping */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-10 sm:p-14 text-center">
          <p className="text-3xl sm:text-4xl mb-3">📭</p>
          <p className="font-semibold text-slate-700 text-sm sm:text-base">Tidak ada tugas</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-4">
            {filterCount || filters.search ? 'Coba ubah filter atau kata kunci.' : 'Mulai tambahkan tugas pertamamu!'}
          </p>
          {!filterCount && !filters.search && (
            <button onClick={() => setShowForm(true)} className="btn-primary">+ Tambah Tugas</button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {useMemo(() => {
            const groups = [
              { id: 'overdue', l: 'Terlewat', i: <MdError className="text-red-500" />, items: [] },
              { id: 'today', l: 'Hari Ini', i: <MdSchedule className="text-primary" />, items: [] },
              { id: 'tomorrow', l: 'Besok', i: <MdEvent className="text-amber-500" />, items: [] },
              { id: 'upcoming', l: 'Mendatang', i: <MdEvent className="text-blue-500" />, items: [] },
              { id: 'nodl', l: 'Tanpa Deadline', i: <MdHistory className="text-slate-400" />, items: [] },
              { id: 'done', l: 'Selesai', i: <MdCheck className="text-emerald-500" />, items: [] }
            ];

            tasks.forEach(t => {
              if (t.status === 'SELESAI') return groups[5].items.push(t);
              if (!t.deadline) return groups[4].items.push(t);
              
              const d = new Date(t.deadline);
              const now = new Date(); now.setHours(0,0,0,0);
              const tmr = new Date(); tmr.setDate(tmr.getDate() + 1); tmr.setHours(0,0,0,0);
              const taskDate = new Date(t.deadline); taskDate.setHours(0,0,0,0);

              if (taskDate < now) groups[0].items.push(t);
              else if (taskDate.getTime() === now.getTime()) groups[1].items.push(t);
              else if (taskDate.getTime() === tmr.getTime()) groups[2].items.push(t);
              else groups[3].items.push(t);
            });

            return groups.filter(g => g.items.length > 0).map(group => (
              <div key={group.id} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    {group.i}
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-slate-800 uppercase tracking-widest">{group.l}</h2>
                    <p className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">{group.items.length} Tugas</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {group.items.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatus}
                      onToggleSubtask={handleToggleSubtask}
                      onAddSubtask={handleAddSubtask}
                    />
                  ))}
                </div>
              </div>
            ));
          }, [tasks, handleDelete, handleEdit, handleStatus, handleToggleSubtask, handleAddSubtask])}
        </div>
      )}

      {/* Modal form */}
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
