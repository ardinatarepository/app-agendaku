import { useState, useEffect } from 'react';
import { useCategories } from '../../hooks';
import { parseNaturalLanguage, cleanTitle } from '../../utils/smartParser';
import DatePicker from '../ui/DatePicker';
import TimePicker from '../ui/TimePicker';
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoAdd,
  IoTrashOutline,
} from 'react-icons/io5';

const PRIO_CFG = {
  RENDAH: { label: 'Rendah', key: 'RENDAH' },
  NORMAL: { label: 'Normal', key: 'NORMAL' },
  TINGGI: { label: 'Tinggi', key: 'TINGGI' },
};

const STATUSES = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];
const STATUS_LBL = {
  SEDANG_DIKERJAKAN: 'Berjalan',
  SELESAI: 'Selesai',
  TERLEWAT: 'Terlewat',
};

const REMINDERS = ['Tidak Ada', '1 Jam', '2 Jam', '5 Jam', '12 Jam'];

export default function TaskForm({ task, onSubmit, onClose, isLoading }) {
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'SEDANG_DIKERJAKAN',
    priority: 'NORMAL',
    deadline: '',
    time: '12:00',
    categoryId: '',
    reminder: 'Tidak Ada',
    isRepeating: false,
    recurrence: 'HARIAN',
    subtasks: [],
    smartDetected: null,
  });

  const [newSubtask, setNewSubtask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (task) {
      let reminderLabel = 'Tidak Ada';
      if (task.reminderHours === 1) reminderLabel = '1 Jam';
      else if (task.reminderHours === 2) reminderLabel = '2 Jam';
      else if (task.reminderHours === 5) reminderLabel = '5 Jam';
      else if (task.reminderHours === 12) reminderLabel = '12 Jam';

      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'SEDANG_DIKERJAKAN',
        priority: task.priority || 'NORMAL',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        time: task.deadline && task.deadline.includes('T') ? task.deadline.split('T')[1].substring(0, 5) : '12:00',
        categoryId: task.categoryId ? String(task.categoryId) : '',
        reminder: reminderLabel,
        isRepeating: task.isRecurring || false,
        recurrence: task.recurrence || 'HARIAN',
        subtasks: task.subtasks || [],
      });
    }
  }, [task]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { title: newSubtask.trim(), isDone: false }],
    }));
    setNewSubtask('');
  };

  const removeSubtask = (idx) => {
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.filter((_, i) => i !== idx),
    }));
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const setPrio = (p) => setForm((f) => ({ ...f, priority: p }));

  const handleTitleChange = (e) => {
    const val = e.target.value;
    const result = parseNaturalLanguage(val, categories);

    setForm((prev) => {
      const nextForm = {
        ...prev,
        title: val,
        smartDetected: result ? result.summary : null,
      };

      // Only apply date/time/priority/category in real-time.
      // Subtasks are NOT added here to avoid flooding on every keystroke.
      if (result) {
        if (result.deadline) nextForm.deadline = result.deadline;
        if (result.time) nextForm.time = result.time;
        if (result.priority) nextForm.priority = result.priority;
        if (result.categoryId) nextForm.categoryId = String(result.categoryId);
      }
      return nextForm;
    });
  };

  const handleApplySmart = () => {
    // Re-run parser to get detected subtasks and merge into form state immediately
    const result = parseNaturalLanguage(form.title, categories);
    setForm((f) => {
      const nextForm = { ...f, smartDetected: null };
      // Clean NLP keywords from the title
      if (result && result.wordsToRemove && result.wordsToRemove.length > 0) {
        nextForm.title = cleanTitle(f.title, result.wordsToRemove);
      }
      // Merge detected subtasks into the list
      if (result && result.subtasks && result.subtasks.length > 0) {
        const existing = f.subtasks || [];
        const newSubs = result.subtasks.filter(
          (nst) => !existing.some((e) => e.title.toLowerCase() === nst.title.toLowerCase())
        );
        nextForm.subtasks = [...existing, ...newSubs];
      }
      return nextForm;
    });
  };

  const handleDismissSmart = () => {
    setForm((f) => ({
      ...f,
      deadline: task ? (task.deadline ? task.deadline.split('T')[0] : '') : '',
      time: task ? (task.deadline && task.deadline.includes('T') ? task.deadline.split('T')[1].substring(0, 5) : '12:00') : '12:00',
      priority: task ? (task.priority || 'NORMAL') : 'NORMAL',
      categoryId: task ? (task.categoryId ? String(task.categoryId) : '') : '',
      smartDetected: null,
    }));
  };

  const handleSubmitForm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.title.trim()) return;

    let finalTitle = form.title.trim();
    let finalDeadline = null;

    if (form.deadline) {
      finalDeadline = `${form.deadline}T${form.time || '12:00'}:00`;
    }

    // Run NLP to pick up deadline if user hasn't manually set one
    const result = parseNaturalLanguage(form.title, categories);
    if (result) {
      // Only use NLP deadline if user hasn't manually set one
      if (!form.deadline && result.deadline) {
        finalDeadline = `${result.deadline}T${form.time || '12:00'}:00`;
      }
      // Add NLP-detected subtasks that aren't already in the list
      if (result.subtasks && result.subtasks.length > 0) {
        result.subtasks.forEach((nst) => {
          if (!form.subtasks.some((pst) => pst.title.toLowerCase() === nst.title.toLowerCase())) {
            form.subtasks.push(nst);
          }
        });
      }
    }

    let reminderHours = 0;
    if (form.reminder === '1 Jam') reminderHours = 1;
    else if (form.reminder === '2 Jam') reminderHours = 2;
    else if (form.reminder === '5 Jam') reminderHours = 5;
    else if (form.reminder === '12 Jam') reminderHours = 12;

    // Build clean payload — only send fields the API expects
    const payload = {
      title: finalTitle,
      description: form.description || '',
      status: form.status || 'SEDANG_DIKERJAKAN',
      priority: form.priority || 'NORMAL',
      deadline: finalDeadline,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      isRecurring: form.isRepeating || false,
      recurrence: form.isRepeating ? form.recurrence : null,
      reminderHours,
      subtasks: form.subtasks.map((st) => ({ title: st.title, isDone: !!st.isDone })),
    };

    onSubmit(payload);
  };

  return (
    <>
      <div
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] h-auto flex flex-col relative"
        >
          {/* Static Header with Title */}
          <div className="px-6 pt-6 pb-2 shrink-0 bg-white">
            <h3 className="text-[#1A1A1A] font-extrabold text-[20px] tracking-tight">
              {task ? 'Edit Tugas' : 'Tambah Tugas'}
            </h3>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2 no-scrollbar">
            <form onSubmit={handleSubmitForm} className="space-y-4">

              {/* Smart Suggestion Banner */}
              {form.smartDetected && (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100 shadow-sm animate-pulse-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                      <span className="text-xs">⚡</span>
                    </div>
                    <div className="text-xs font-bold text-amber-800 leading-tight">
                      Jadwal terdeteksi: <span className="underline decoration-amber-400 decoration-2">{form.smartDetected}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={handleApplySmart}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl hover:opacity-90 shadow-sm transition-all border-none cursor-pointer"
                    >
                      ✓ Terapkan
                    </button>
                    <button
                      type="button"
                      onClick={handleDismissSmart}
                      className="w-7 h-7 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 rounded-xl shadow-sm transition-all active:scale-95 border-none cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Nama Tugas */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Nama Tugas</label>
                <input
                  type="text"
                  className="w-full h-12 px-4 bg-[#F8FAFC] border border-slate-100 rounded-xl font-normal placeholder:font-normal text-sm text-[#1A1A1A] placeholder:text-slate-300 focus:outline-none focus:border-black focus:bg-white transition-all"
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Masukan nama tugas anda"
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Deskripsi (opsional)</label>
                <textarea
                  className="w-full h-20 px-4 py-2.5 bg-[#F8FAFC] border border-slate-100 rounded-xl font-normal placeholder:font-normal text-sm text-[#1A1A1A] placeholder:text-slate-300 focus:outline-none focus:border-black focus:bg-white resize-none transition-all"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Deskripsi tugas..."
                />
              </div>

              {/* Status (Only when editing) */}
              {task && (
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Status</label>
                  <div className="flex gap-2.5">
                    {STATUSES.map((s) => {
                      const isActive = form.status === s;
                      let activeStyle = { borderColor: '#3B82F6', color: '#2563EB', backgroundColor: '#EFF6FF' };
                      if (s === 'SELESAI') activeStyle = { borderColor: '#10B981', color: '#059669', backgroundColor: '#ECFDF5' };
                      if (s === 'TERLEWAT') activeStyle = { borderColor: '#EF4444', color: '#DC2626', backgroundColor: '#FEE2E2' };

                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, status: s }))}
                          className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                            isActive ? 'border-2' : 'border-slate-100 bg-[#F8FAFC] text-slate-400 hover:border-slate-200'
                          }`}
                          style={isActive ? activeStyle : {}}
                        >
                          {STATUS_LBL[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prioritas */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Prioritas</label>
                <div className="flex gap-3">
                  {Object.entries(PRIO_CFG).map(([key, cfg]) => {
                    const isActive = form.priority === key;
                      const activeStyles = {
                        RENDAH: 'bg-slate-500 text-white border-slate-500 shadow-sm',
                        NORMAL: 'bg-amber-500 text-white border-amber-500 shadow-sm',
                        TINGGI: 'bg-red-500 text-white border-red-500 shadow-sm',
                      }[key];

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPrio(key)}
                          className={`flex-1 py-3 text-sm font-normal rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? activeStyles
                              : 'border-slate-100 bg-[#F8FAFC] text-slate-700 hover:border-slate-200'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                  })}
                </div>
              </div>

              {/* Sub-Tugas */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Sub Tugas</label>
                <div className="flex gap-3 mb-3">
                  <input
                    className="flex-1 h-12 px-4 bg-[#F8FAFC] border border-slate-100 rounded-xl font-normal placeholder:font-normal text-sm text-[#1A1A1A] placeholder:text-slate-300 focus:outline-none focus:border-black focus:bg-white transition-all"
                    placeholder="Masukan Sub Tugas"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="w-12 h-12 bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all border-none cursor-pointer shrink-0"
                  >
                    <IoAdd size={24} />
                  </button>
                </div>

                <div className="space-y-2">
                  {form.subtasks.map((st, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 group shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            subtasks: f.subtasks.map((s, idx) => (idx === i ? { ...s, isDone: !s.isDone } : s)),
                          }));
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border-none ${
                          st.isDone ? 'bg-[#FACC15] text-black' : 'bg-slate-100 hover:bg-slate-200 text-transparent'
                        }`}
                      >
                        {st.isDone && <span className="text-[10px] font-black">✓</span>}
                      </button>
                      <span className={`flex-1 text-sm font-medium ${st.isDone ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                        {st.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(i)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border-none bg-transparent cursor-pointer"
                      >
                        <IoTrashOutline size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Tanggal & Waktu</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="flex-1 h-12 px-4 bg-[#F8FAFC] border border-slate-100 rounded-xl flex items-center justify-between font-normal text-sm text-[#1A1A1A] hover:border-black transition-all bg-[#F8FAFC] cursor-pointer"
                  >
                    <span className={form.deadline ? 'text-slate-800 font-normal' : 'text-slate-300'}>
                      {form.deadline || 'Tanggal & Waktu'}
                    </span>
                    <IoCalendarOutline className="text-slate-800" size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    className="w-32 h-12 px-4 bg-[#F8FAFC] border border-slate-100 rounded-xl flex items-center justify-between font-normal text-sm text-slate-800 hover:border-black transition-all bg-[#F8FAFC] cursor-pointer"
                  >
                    <span>{form.time}</span>
                    <IoTimeOutline className="text-slate-800" size={18} />
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, categoryId: '' }))}
                    className={`px-4 py-2 text-xs font-normal rounded-lg border transition-all cursor-pointer ${
                      !form.categoryId ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  {categories.map((c) => {
                    const isActive = form.categoryId === String(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, categoryId: String(c.id) }))}
                        className="px-4 py-2 text-xs font-normal rounded-lg border transition-all flex items-center gap-2 cursor-pointer"
                        style={{
                          backgroundColor: isActive ? `${c.color}15` : 'white',
                          borderColor: isActive ? c.color : '#f1f5f9',
                          color: isActive ? c.color : '#94a3b8',
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ingatkan Saya */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-2 ml-1">Ingatkan saya</label>
                <div className="flex flex-wrap gap-2">
                  {REMINDERS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, reminder: r }))}
                      className={`px-4 py-2 text-xs font-normal rounded-lg border transition-all cursor-pointer ${
                        form.reminder === r ? 'border-[#FACC15] bg-[#FACC15] text-black shadow-sm' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tugas Berulang */}
              <div className="pt-2 pb-4">
                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 shadow-sm mb-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-800 block">Tugas Berulang</label>
                    <span className="text-xs text-slate-400 font-normal">Ulangi tugas ini secara otomatis</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isRepeating: !f.isRepeating }))}
                    className={`w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 cursor-pointer ${
                      form.isRepeating ? 'bg-[#FACC15]' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-all duration-300 ${
                        form.isRepeating ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {form.isRepeating && (
                  <div className="animate-fade-in flex gap-2.5 ml-1">
                    {['HARIAN', 'MINGGUAN', 'BULANAN'].map((period) => {
                      const label = { HARIAN: 'Harian', MINGGUAN: 'Mingguan', BULANAN: 'Bulanan' }[period];
                      const isActive = form.recurrence === period;
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, recurrence: period }))}
                          className={`flex-1 py-2.5 text-xs font-normal rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? 'border-[#FACC15] bg-[#FACC15] text-black shadow-sm'
                              : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Fixed Footer with Cancel and Submit Buttons */}
          <div className="px-6 py-4 bg-white border-t border-slate-50 shrink-0 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#EF4444] text-white text-sm font-bold hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmitForm}
              disabled={isLoading || !form.title.trim()}
              className="px-6 py-2.5 rounded-lg bg-[#FACC15] text-black text-sm font-bold hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all border-none cursor-pointer"
            >
              {isLoading ? '...' : 'Simpan'}
            </button>
          </div>

          {showDatePicker && (
            <DatePicker
              value={form.deadline}
              onSelect={(d) => {
                setForm((f) => ({ ...f, deadline: d }));
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}

          {showTimePicker && (
            <TimePicker
              value={form.time}
              onSelect={(t) => setForm((f) => ({ ...f, time: t }))}
              onClose={() => setShowTimePicker(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}
