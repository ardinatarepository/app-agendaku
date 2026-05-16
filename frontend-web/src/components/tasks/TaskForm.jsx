import { useState, useEffect } from 'react';
import { useCategories } from '../../hooks';
import { 
  IoClose, 
  IoAdd, 
  IoTrashOutline, 
  IoCalendarOutline, 
  IoTimeOutline 
} from 'react-icons/io5';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';

const STATUSES  = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];
const STATUS_LBL = { SEDANG_DIKERJAKAN: 'Sedang Berjalan', SELESAI: 'Selesai', TERLEWAT: 'Terlewat' };
const PRIO_CFG  = {
  RENDAH: { label: 'Rendah', active: 'border-blue-400 bg-blue-50 text-blue-600' },
  NORMAL: { label: 'Normal', active: 'border-amber-400 bg-amber-50 text-amber-600' },
  TINGGI: { label: 'Tinggi', active: 'border-red-400 bg-red-50 text-red-600' },
};
const REMINDERS = ['Tidak Ada', '1 Jam', '2 Jam', '5 Jam', '12 Jam'];

export default function TaskForm({ task, onSubmit, onClose, isLoading }) {
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: '', description: '', status: 'SEDANG_DIKERJAKAN',
    priority: 'NORMAL', deadline: '', time: '12:00', categoryId: '',
    reminder: 'Tidak Ada', isRepeating: false, recurrence: 'HARIAN',
    subtasks: []
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
        status:      task.status      || 'SEDANG_DIKERJAKAN',
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
       // Send without 'Z' to treat as local time
       finalDeadline = `${form.deadline}T${form.time}:00`;
    }

    // Map reminder label to hours
    let reminderHours = 0;
    if (form.reminder === '1 Jam') reminderHours = 1;
    else if (form.reminder === '2 Jam') reminderHours = 2;
    else if (form.reminder === '5 Jam') reminderHours = 5;
    else if (form.reminder === '12 Jam') reminderHours = 12;

    const payload = {
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      deadline:   finalDeadline,
      isRecurring: form.isRepeating,
      recurrence: form.isRepeating ? form.recurrence : null,
      reminderHours,
      subtasks: form.subtasks.map(st => ({ title: st.title, isDone: !!st.isDone }))
    };

    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-in h-[92vh] flex flex-col relative">
        
        {/* Mobile-Style Top Actions */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0 bg-white">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl border-2 border-red-500 text-red-500 text-[15px] font-bold hover:bg-red-50 transition-all"
          >
            Batal
          </button>
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading || !form.title.trim()}
            className="px-8 py-2.5 rounded-2xl bg-[#1E1E1E] text-white text-[15px] font-bold hover:opacity-90 shadow-lg disabled:opacity-50 transition-all"
          >
            {isLoading ? '...' : 'Simpan'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar pt-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Nama Tugas */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-2.5 block ml-1 tracking-wide">Nama Tugas *</label>
              <input 
                className="w-full border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]/50" 
                value={form.title} 
                onChange={set('title')} 
                placeholder="Masukan Nama Tugas" 
                maxLength={200} 
                required 
                autoFocus 
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-2.5 block ml-1 tracking-wide">Deskripsi (opsional)</label>
              <textarea 
                className="w-full border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-slate-300 bg-[#F8FAFC]/50" 
                value={form.description} 
                onChange={set('description')} 
                placeholder="Deskripsi Tugas (Opsional)" 
              />
            </div>

            {/* Status (From mobile reference) */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-2.5 block ml-1 tracking-wide">Status</label>
              <div className="flex gap-2.5">
                {STATUSES.map(s => {
                  const isActive = form.status === s;
                  // Senior Failsafe: Use standard Tailwind colors + Inline Style
                  let activeClass = 'border-blue-500 bg-blue-50 text-blue-600 border-2'; 
                  if (s === 'SELESAI') activeClass = 'border-emerald-500 bg-emerald-50 text-emerald-600 border-2';
                  if (s === 'TERLEWAT') activeClass = 'border-red-500 bg-red-50 text-red-600 border-2';

                  return (
                    <button
                      key={s} type="button" 
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-3.5 text-sm font-bold rounded-2xl border transition-all ${
                        isActive ? activeClass : 'border-slate-100 bg-white text-slate-300 hover:border-slate-200'
                      }`}
                      style={isActive && s === 'SEDANG_DIKERJAKAN' ? { borderColor: '#3B82F6', color: '#2563EB', backgroundColor: '#EFF6FF' } : {}}
                    >
                      {STATUS_LBL[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioritas */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-2.5 block ml-1 tracking-wide">Prioritas</label>
              <div className="flex gap-3">
                {Object.entries(PRIO_CFG).map(([key, cfg]) => (
                  <button
                    key={key} type="button" onClick={() => setPrio(key)}
                    className={`flex-1 py-3.5 text-sm font-bold rounded-2xl border-2 transition-all ${
                      form.priority === key ? cfg.active : 'border-slate-100 bg-white text-slate-300 hover:border-slate-200'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tugas */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-2.5 block ml-1 tracking-wide">Sub-Tugas</label>
              <div className="flex gap-3 mb-4">
                <input 
                  className="flex-1 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:border-primary outline-none transition-all placeholder:text-slate-300 shadow-sm bg-[#F8FAFC]/50" 
                  placeholder="Tambah sub-tugas..." 
                  value={newSubtask} 
                  onChange={e => setNewSubtask(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())} 
                />
                <button type="button" onClick={addSubtask} className="w-14 h-14 bg-[#1E1E1E] text-white rounded-2xl flex items-center justify-center hover:opacity-90 shadow-lg transition-all">
                  <IoAdd size={28} />
                </button>
              </div>

              <div className="space-y-2.5">
                {form.subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          subtasks: f.subtasks.map((s, idx) => idx === i ? { ...s, isDone: !s.isDone } : s)
                        }));
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${st.isDone ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-2 border-slate-100 text-transparent'}`}
                    >
                      {st.isDone && <span className="text-xs">✓</span>}
                    </button>
                    <span className={`flex-1 text-sm font-bold ${st.isDone ? 'line-through text-slate-300' : 'text-slate-600'}`}>
                      {st.title}
                    </span>
                    <button type="button" onClick={() => removeSubtask(i)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <IoTrashOutline size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadline & Waktu */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-2.5 block ml-1 tracking-wide">Deadline & Waktu</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="flex-1 flex items-center justify-between border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 hover:border-primary transition-all bg-[#F8FAFC]/50"
                >
                  <span className={form.deadline ? 'text-slate-800' : 'text-slate-300'}>{form.deadline || 'Pilih Tanggal'}</span>
                  <IoCalendarOutline className="text-slate-300" size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowTimePicker(true)}
                  className="w-36 flex items-center justify-between border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 hover:border-primary transition-all bg-[#F8FAFC]/50"
                >
                  <span className="text-slate-800">{form.time}</span>
                  <IoTimeOutline className="text-slate-300" size={20} />
                </button>
              </div>
            </div>

            {/* Reminder Section */}
            <div>
              <label className="text-[12px] font-semibold text-slate-500 mb-3 block ml-1 tracking-wide">Ingatkan saya</label>
              <div className="flex flex-wrap gap-2.5">
                {REMINDERS.map(r => (
                  <button
                    key={r} type="button" onClick={() => setForm(f => ({...f, reminder: r}))}
                    className={`px-5 py-2.5 text-[13px] font-bold rounded-full border transition-all ${
                      form.reminder === r ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori */}
            <div className="pb-8">
              <label className="text-[12px] font-semibold text-slate-500 mb-3 block ml-1 tracking-wide">Kategori</label>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, categoryId: '' }))}
                  className={`px-5 py-2.5 text-[13px] font-bold rounded-full border transition-all ${
                    !form.categoryId ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  Semua
                </button>
                {categories.map(c => {
                  const isActive = form.categoryId === String(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, categoryId: String(c.id) }))}
                      className="px-5 py-2.5 text-[13px] font-bold rounded-full border transition-all flex items-center gap-2"
                      style={{
                        backgroundColor: isActive ? `${c.color}15` : 'white',
                        borderColor: isActive ? c.color : '#f1f5f9',
                        color: isActive ? c.color : '#94a3b8'
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

          </form>
        </div>

        {showDatePicker && (
          <DatePicker
            value={form.deadline}
            onSelect={(d) => { setForm(f => ({ ...f, deadline: d })); setShowDatePicker(false); }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        {showTimePicker && (
          <TimePicker
            value={form.time}
            onSelect={(t) => setForm(f => ({ ...f, time: t }))}
            onClose={() => setShowTimePicker(false)}
          />
        )}
      </div>
    </div>
  );
}
