import { useState } from 'react';
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
  MdAccessTime,
  MdHistory
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
  const handleDelete = async (id) => { if (window.confirm('Hapus tugas ini?')) await deleteTask.mutateAsync(id); };
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
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <MdSearch size={20} />
          </span>
          <input
            className="input pl-10 text-sm"
            placeholder="Cari tugas..."
            value={filters.search}
            onChange={(e) => setFilter('search')(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilterPanel(s => !s)}
          className={`relative px-4 py-2.5 rounded-xl border text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            showFilterPanel || filterCount > 0
              ? 'border-primary/30 bg-primary text-white shadow-lg shadow-primary/20'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
          }`}
        >
          <MdFilterList size={20} />
          <span className="hidden sm:inline">Filter</span>
          {filterCount > 0 && (
            <span className="w-5 h-5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
        {filterCount > 0 && (
          <button onClick={() => setFilters({ status: '', priority: '', categoryId: '', search: '' })} className="btn-ghost text-xs px-3 font-bold flex items-center gap-1.5">
            <MdHistory size={16} /> Reset
          </button>
        )}
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
            <h3 className="font-black text-slate-800">Filter & Urutkan</h3>
            <button onClick={() => setFilters({ status: '', priority: '', categoryId: '', search: '' })} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
              Reset Semua
            </button>
          </div>

          <div className="space-y-6">
            {/* Urutkan Berdasarkan */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Urutkan Berdasarkan</p>
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prioritas</p>
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kategori</p>
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

      {/* Task list — 1 col mobile, 2 col md, 3 col lg */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {tasks.map(task => (
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
