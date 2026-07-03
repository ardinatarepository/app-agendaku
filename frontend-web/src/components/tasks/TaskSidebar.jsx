import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  IoCheckmarkCircle,
  IoTrashOutline,
  IoCreateOutline,
  IoAdd,
  IoClose,
} from 'react-icons/io5';

const PRIORITY_CFG = {
  TINGGI: { label: 'Tinggi', color: '#EF4444', bg: '#FEE2E2' },
  NORMAL: { label: 'Normal', color: '#D97706', bg: '#FEF3C7' },
  RENDAH: { label: 'Rendah', color: '#4B5563', bg: '#F3F4F6' },
};

const STATUS_CFG = {
  SEDANG_DIKERJAKAN: { label: 'Berjalan', color: '#3B82F6', bg: '#EFF6FF' },
  SELESAI: { label: 'Selesai', color: '#10B981', bg: '#ECFDF5' },
  TERLEWAT: { label: 'Terlewat', color: '#EF4444', bg: '#FEE2E2' },
};

export default function TaskSidebar({
  task,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}) {
  const [newSub, setNewSub] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!task) return null;

  const isFinished = task.status === 'SELESAI';
  const priorityCfg = PRIORITY_CFG[task.priority || 'NORMAL'];
  const statusCfg = STATUS_CFG[task.status] || STATUS_CFG['SEDANG_DIKERJAKAN'];

  const handleAddSubtask = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newSub.trim()) {
      onAddSubtask(task.id, newSub.trim());
      setNewSub('');
    }
  };

  const toggleStatus = () => {
    onStatusChange(task.id, isFinished ? 'SEDANG_DIKERJAKAN' : 'SELESAI');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 280ms ease',
        }}
        onClick={handleClose}
      />

      {/* ── MODAL PANEL ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#FAF9F6] rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
          style={{
            maxHeight: '85vh',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(16px)',
            transition: 'opacity 280ms ease, transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* ── DARK HEADER ── */}
          <div className="bg-[#1A1A1A] px-6 py-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-black text-white leading-tight tracking-tight mb-1">
                  {task.title}
                </h2>
                <span className="text-[12px] text-white/50 font-normal">
                  Dibuat pada {task.createdAt ? format(new Date(task.createdAt), 'dd MMMM yyyy', { locale: idLocale }) : '-'}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0 pt-1">
                <button
                  onClick={() => onEdit(task)}
                  className="text-white/80 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0.5"
                  title="Edit Tugas"
                >
                  <IoCreateOutline size={22} />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-red-500 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer p-0.5"
                  title="Hapus Tugas"
                >
                  <IoTrashOutline size={22} />
                </button>
                <button
                  onClick={handleClose}
                  className="text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0.5"
                  title="Tutup"
                >
                  <IoClose size={26} />
                </button>
              </div>
            </div>
          </div>

          {/* ── BODY (Warm Grey background, wrapper for white card) ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              
              {/* Properties Section */}
              <div className="flex flex-col text-sm">
                
                {/* Deadline */}
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 font-normal">Deadline</span>
                  {task.deadline ? (
                    <span className="text-slate-800 font-normal tracking-tight">
                      {format(new Date(task.deadline), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                    </span>
                  ) : (
                    <span className="text-slate-300 font-normal">Tanpa Deadline</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 font-normal">Status</span>
                  <button 
                    onClick={toggleStatus}
                    className="px-3 py-1.5 rounded-lg text-xs font-normal transition-all border-none cursor-pointer hover:brightness-95 active:scale-95"
                    style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                  >
                    {statusCfg.label}
                  </button>
                </div>

                {/* Priority */}
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 font-normal">Prioritas</span>
                  <span 
                    className="px-3 py-1.5 rounded-lg text-xs font-normal"
                    style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.color }}
                  >
                    {priorityCfg.label}
                  </span>
                </div>

                {/* Category */}
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 font-normal">Kategori</span>
                  {task.category ? (
                    <span className="font-normal text-right" style={{ color: task.category.color }}>
                      {task.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-300 font-normal">Tanpa Kategori</span>
                  )}
                </div>

              </div>

              {/* Description Section */}
              <div>
                <h4 className="text-sm font-normal text-[#1A1A1A] mb-2">Deskripsi</h4>
                <div className="bg-[#EFF1F4] rounded-xl p-3 text-slate-500 text-sm font-normal leading-relaxed">
                  {task.description ? task.description : 'Tidak ada deskripsi.'}
                </div>
              </div>

              {/* Sub Tasks Section */}
              <div>
                <h4 className="text-sm font-normal text-[#1A1A1A] mb-3">Sub Tugas</h4>
                <div className="space-y-2">
                  {task.subtasks?.map(st => (
                    <div key={st.id} className="flex items-center gap-3 group/st py-1">
                      <button 
                        onClick={() => onToggleSubtask(task.id, st.id)} 
                        className="bg-transparent border-none p-0 cursor-pointer shrink-0 flex items-center justify-center"
                      >
                        {st.isDone ? (
                          <IoCheckmarkCircle size={24} className="text-[#FACC15]" />
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-full border-2 border-slate-300 hover:border-slate-500 transition-colors" />
                        )}
                      </button>
                      
                      <span className={`text-sm font-normal flex-1 ${st.isDone ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                        {st.title}
                      </span>

                      <button
                        onClick={() => onDeleteSubtask(task.id, st.id)}
                        className="opacity-0 group-hover/st:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer"
                      >
                        <IoTrashOutline size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add Subtask Input */}
                  {!isFinished && (
                    <div className="flex items-center gap-3 py-2 border-t border-dashed border-slate-100 mt-2">
                      <div className="w-5 h-5 flex items-center justify-center text-slate-300">
                        <IoAdd size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Tambah sub tugas..."
                        className="flex-1 bg-transparent border-none text-sm font-normal text-slate-600 outline-none placeholder:text-slate-300"
                        value={newSub}
                        onChange={e => setNewSub(e.target.value)}
                        onKeyDown={handleAddSubtask}
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
