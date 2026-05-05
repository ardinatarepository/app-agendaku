import { useState, useEffect } from 'react';
import { useCategories } from '../../hooks';
import { MdClose, MdAdd, MdDelete, MdLocalOffer } from 'react-icons/md';

const STATUSES  = ['BELUM_MULAI', 'SEDANG_DIKERJAKAN', 'SELESAI'];
const STATUS_LBL = { BELUM_MULAI: 'Belum Mulai', SEDANG_DIKERJAKAN: 'Sedang Dikerjakan', SELESAI: 'Selesai' };
const PRIO_CFG  = {
  RENDAH: { label: 'Rendah', active: 'border-slate-400 bg-slate-100 text-slate-700' },
  NORMAL: { label: 'Normal', active: 'border-amber-400 bg-amber-100 text-amber-700' },
  TINGGI: { label: 'Tinggi', active: 'border-red-400 bg-red-100 text-red-700' },
};
const REMINDERS = ['Tidak Ada', '1 Jam', '2 Jam', '5 Jam', '12 Jam'];

export default function TaskForm({ task, onSubmit, onClose, isLoading }) {
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: '', description: '', status: 'BELUM_MULAI',
    priority: 'NORMAL', deadline: '', time: '12:00', categoryId: '',
    reminder: 'Tidak Ada', isRepeating: false, recurrence: 'HARIAN',
    subtasks: []
  });

  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      // Parse reminderHours to label
      let reminderLabel = 'Tidak Ada';
      if (task.reminderHours === 1) reminderLabel = '1 Jam';
      else if (task.reminderHours === 2) reminderLabel = '2 Jam';
      else if (task.reminderHours === 5) reminderLabel = '5 Jam';
      else if (task.reminderHours === 12) reminderLabel = '12 Jam';

      setForm({
        title:       task.title       || '',
        description: task.description || '',
        status:      task.status      || 'BELUM_MULAI',
        priority:    task.priority    || 'NORMAL',
        deadline:    task.deadline    ? task.deadline.split('T')[0] : '',
        time:        task.deadline && task.deadline.includes('T') ? task.deadline.split('T')[1].substring(0,5) : '12:00',
        categoryId:  task.categoryId  ? String(task.categoryId) : '',
        reminder:    reminderLabel,
        isRepeating: task.isRecurring || false,
        recurrence:  task.recurrence  || 'HARIAN',
        subtasks:    task.subtasks    || []
      });
    }
  }, [task]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm(f => ({
      ...f,
      subtasks: [...f.subtasks, { title: newSubtask.trim(), isDone: false }]
    }));
    setNewSubtask('');
  };

  const removeSubtask = (idx) => {
    setForm(f => ({
      ...f,
      subtasks: f.subtasks.filter((_, i) => i !== idx)
    }));
  };

  const set    = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const setPrio = (p) => setForm(f => ({ ...f, priority: p }));

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) return;
    
    // Combine deadline and time
    let finalDeadline = null;
    if (form.deadline) {
       finalDeadline = `${form.deadline}T${form.time}:00Z`; // Simple combination
    }

    // Map reminder label to hours
    let reminderHours = 0;
    if (form.reminder === '1 Jam') reminderHours = 1;
    else if (form.reminder === '2 Jam') reminderHours = 2;
    else if (form.reminder === '5 Jam') reminderHours = 5;
    else if (form.reminder === '12 Jam') reminderHours = 12;

    onSubmit({
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      deadline:   finalDeadline,
      isRecurring: form.isRepeating,
      recurrence: form.isRepeating ? form.recurrence : null,
      reminderHours
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in h-[90vh] flex flex-col">

        {/* Header ala Mobile */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <button onClick={onClose} className="text-slate-500 font-medium hover:text-slate-700">Batal</button>
          <h2 className="text-[17px] font-black text-slate-800">
            {task ? 'Edit Tugas' : 'Tambah Tugas'}
          </h2>
          <button onClick={handleSubmit} disabled={isLoading || !form.title.trim()} className="text-slate-500 font-medium hover:text-[#15152b] disabled:opacity-50">
            Simpan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 pb-20">

          {/* Judul & Deskripsi */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Nama Tugas *</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#15152b] focus:ring-1 focus:ring-[#15152b] outline-none transition-all" value={form.title} onChange={set('title')} placeholder="Masukan Nama Tugas" maxLength={200} required autoFocus />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Deskripsi (opsional)</label>
              <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm h-24 resize-none focus:border-[#15152b] focus:ring-1 focus:ring-[#15152b] outline-none transition-all" value={form.description} onChange={set('description')} placeholder="Deskripsi Tugas (Opsional)" />
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s} type="button" onClick={() => setForm(f => ({...f, status: s}))}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                    form.status === s ? 'border-[#15152b] bg-[#15152b]/5 text-[#15152b]' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {STATUS_LBL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Prioritas */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 mb-2 block">Prioritas</label>
            <div className="flex gap-2">
              {Object.entries(PRIO_CFG).map(([key, cfg]) => (
                <button
                  key={key} type="button" onClick={() => setPrio(key)}
                  className={`flex-1 py-2.5 text-xs font-medium rounded-xl border transition-all ${
                    form.priority === key ? cfg.active : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline & Waktu */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 mb-2 block">Deadline & Waktu</label>
            <div className="flex gap-3">
              <input type="date" className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 focus:border-[#15152b] focus:ring-1 focus:ring-[#15152b] outline-none" value={form.deadline} onChange={set('deadline')} />
              <input type="time" className="w-28 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 focus:border-[#15152b] focus:ring-1 focus:ring-[#15152b] outline-none" value={form.time} onChange={set('time')} />
            </div>
          </div>

          {/* Ingatkan saya */}
          <div className="mb-6 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            <label className="text-xs font-bold text-slate-500 mb-2 block">Ingatkan saya (Jam Sebelum Deadline)</label>
            <div className="flex gap-2 min-w-max">
              {REMINDERS.map(r => (
                <button
                  key={r} type="button" onClick={() => setForm(f => ({...f, reminder: r}))}
                  className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                    form.reminder === r ? 'border-[#15152b] bg-[#15152b]/5 text-[#15152b]' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Tugas Berulang Toggle */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500">Tugas Berulang</label>
              <button 
                type="button" onClick={() => setForm(f => ({...f, isRepeating: !f.isRepeating}))}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${form.isRepeating ? 'bg-[#15152b]' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.isRepeating ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            {form.isRepeating && (
              <div className="flex gap-2">
                {['HARIAN', 'MINGGUAN', 'BULANAN'].map(rec => (
                  <button
                    key={rec} type="button" onClick={() => setForm(f => ({...f, recurrence: rec}))}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                      form.recurrence === rec ? 'border-[#15152b] bg-[#15152b]/5 text-[#15152b]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {rec === 'HARIAN' ? 'Harian' : rec === 'MINGGUAN' ? 'Mingguan' : 'Bulanan'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Daftar Sub-Tugas */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 mb-2 block">Daftar Sub-Tugas</label>
            
            <div className="space-y-2 mb-3">
              {form.subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({
                        ...f,
                        subtasks: f.subtasks.map((s, idx) => idx === i ? { ...s, isDone: !s.isDone } : s)
                      }));
                    }}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${st.isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}
                  >
                    {st.isDone && <span className="text-[10px]">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm font-medium ${st.isDone ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                    {st.title}
                  </span>
                  <button type="button" onClick={() => removeSubtask(i)} className="text-slate-400 hover:text-red-500 transition-all">
                    <MdDelete size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#15152b] outline-none" placeholder="Contoh: Beli susu, Kerjakan bab 1..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())} />
              <button type="button" onClick={addSubtask} className="w-12 h-12 bg-[#15152b] text-white rounded-xl flex items-center justify-center hover:bg-[#15152b]/90 transition-all">
                <MdAdd size={24} />
              </button>
            </div>
          </div>

          {/* Kategori (Optional) */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 mb-2 block">Kategori</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, categoryId: '' }))}
                className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${
                  !form.categoryId ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                Tanpa Kategori
              </button>
              {categories.map(c => {
                const isActive = form.categoryId === String(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, categoryId: String(c.id) }))}
                    className="px-4 py-2 text-xs font-medium rounded-full border transition-all"
                    style={{
                      backgroundColor: isActive ? `${c.color}22` : 'white',
                      borderColor: isActive ? c.color : '#e2e8f0',
                      color: isActive ? c.color : '#64748b'
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
