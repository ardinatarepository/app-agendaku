import { useState, memo, useEffect } from 'react';
import { 
  IoCalendarOutline, 
  IoEllipsisVertical, 
  IoArrowUndo, 
  IoTrashOutline, 
  IoCreateOutline,
  IoChevronDown,
  IoChevronUp,
  IoCheckmarkCircle,
  IoEllipseOutline,
  IoTimeOutline,
  IoChevronForward
} from 'react-icons/io5';
import { format } from 'date-fns';

const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      if (!deadline) return setTimeLeft('');
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) return setTimeLeft('Waktu Habis');

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let str = '';
      if (d > 0) str += `${d}d `;
      if (h > 0) str += `${h}h `;
      str += `${m}m`;
      setTimeLeft(str);
    };

    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return null;
  return <span className="text-[11px] font-black text-[#FACC15] uppercase tracking-wider">{timeLeft}</span>;
};

const TaskCard = ({ 
    task, 
    onEdit, 
    onDelete, 
    onStatusChange, 
    onToggleSubtask, 
    onAddSubtask,
    onDeleteSubtask 
  }) => {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newSub, setNewSub] = useState('');

  const isFinished = task.status === 'SELESAI';
  const isOverdue = task.status === 'TERLEWAT' || (task.status !== 'SELESAI' && task.deadline && new Date(task.deadline) < new Date());
  
  const totalSub = task.subtasks?.length || 0;
  const doneSub = task.subtasks?.filter(st => st.isDone).length || 0;

  const handleAddSubmit = (e) => {
    if (e.key === 'Enter' && newSub.trim()) {
      onAddSubtask(task.id, newSub.trim());
      setNewSub('');
    }
  };

  const priorityCfg = {
    TINGGI: { color: '#dc2626', symbol: 'T', bg: '#fee2e2' },
    NORMAL: { color: '#b45309', symbol: 'N', bg: '#fef3c7' },
    RENDAH: { color: '#475569', symbol: 'R', bg: '#f1f5f9' },
  }[task.priority || 'NORMAL'] || { color: '#475569', symbol: 'N', bg: '#f1f5f9' };

  const statusCfg = {
    SEDANG_DIKERJAKAN: { label: 'BERJALAN', color: '#0284C7', bg: '#E0F2FE' },
    SELESAI: { label: 'SELESAI', color: '#10B981', bg: '#ECFDF5' },
    TERLEWAT: { label: 'TERLEWAT', color: '#EF4444', bg: '#FEE2E2' },
  }[task.status] || { label: 'TUGAS', color: '#0284C7', bg: '#E0F2FE' };

  return (
    <div className={`bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all group ${(isFinished || isOverdue) ? 'opacity-60' : ''} ${isOverdue && !isFinished ? 'bg-red-50/30' : ''}`}>
      
      <div className="p-4 flex-1">
        {/* Top Row: Date & Menu */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <IoCalendarOutline size={14} className={isOverdue && !isFinished ? 'text-red-500' : ''} />
            <span className={`text-[10px] font-bold uppercase tracking-tight ${isOverdue && !isFinished ? 'text-red-500' : ''}`}>
              {task.deadline ? format(new Date(task.deadline), 'dd MMM yyyy, HH:mm') : 'Tanpa Deadline'}
            </span>
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-2">
              {isFinished && (
                <button 
                  onClick={() => onStatusChange(task.id, 'SEDANG_DIKERJAKAN')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-red-500 text-[10px] font-black hover:bg-red-50 transition-colors"
                >
                  <IoArrowUndo size={12} />
                  <span>UNDO</span>
                </button>
              )}
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
              >
                <IoEllipsisVertical size={20} />
              </button>
            </div>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 z-50 animate-fade-in">
                  {!(isFinished || isOverdue) && (
                    <button 
                      onClick={() => { setShowMenu(false); onEdit(task); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                      <IoCreateOutline size={16} />
                      <span>Edit</span>
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowMenu(false); onDelete(task.id); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <IoTrashOutline size={16} />
                    <span>Hapus</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-[15px] font-bold text-black leading-tight mb-4 tracking-tight ${(isFinished || isOverdue) ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </h3>

        {/* Badges Row */}
        <div className="flex items-center gap-2">
          <div 
            className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            {statusCfg.label}
          </div>

          <div 
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-black"
            style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.color }}
          >
            {priorityCfg.symbol}
          </div>

          {task.category && (
            <div 
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ backgroundColor: task.category.color }}
            >
              {task.category.name.charAt(0).toUpperCase()}
            </div>
          )}

          {totalSub > 0 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="ml-auto flex items-center gap-1.5 group/sub"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#334155]" />
              <span className="text-[10px] font-black text-[#334155]">{doneSub}/{totalSub}</span>
              {expanded ? <IoChevronUp size={18} className="text-[#334155]" /> : <IoChevronDown size={18} className="text-[#334155]" />}
            </button>
          )}
          {totalSub === 0 && !isFinished && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="ml-auto text-[10px] font-bold text-slate-300 hover:text-primary transition-colors uppercase tracking-widest"
            >
              {expanded ? 'Tutup' : '+ Subtask'}
            </button>
          )}
        </div>

        {/* Expanded: Subtasks & Description */}
        {expanded && (
          <div className="mt-5 space-y-4 pt-4 border-t border-slate-50 animate-fade-in">
            {task.description && (
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                {task.description}
              </p>
            )}
            
            <div className="space-y-3">
              {task.subtasks?.map(st => (
                <div key={st.id} className="flex items-center justify-between group/st">
                  <button 
                    onClick={() => onToggleSubtask(task.id, st.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    {st.isDone ? (
                      <IoCheckmarkCircle size={20} className="text-[#FACC15]" />
                    ) : (
                      <IoEllipseOutline size={20} className="text-[#D1D5DB]" />
                    )}
                    <span className={`text-[13px] font-bold ${st.isDone ? 'line-through text-[#94A3B8]' : 'text-slate-600'}`}>
                      {st.title}
                    </span>
                  </button>
                  <button 
                    onClick={() => onDeleteSubtask(task.id, st.id)}
                    className="opacity-0 group-hover/st:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <IoTrashOutline size={14} />
                  </button>
                </div>
              ))}
              
              {!isFinished && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Tambah subtask..."
                    className="flex-1 bg-transparent border-none text-[13px] font-bold text-slate-600 outline-none placeholder:text-slate-300 placeholder:font-medium"
                    value={newSub}
                    onChange={e => setNewSub(e.target.value)}
                    onKeyDown={handleAddSubmit}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar (Black Parity) */}
      <div className="bg-black p-3 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IoTimeOutline size={14} className="text-[#FACC15]" />
          <CountdownTimer deadline={task.deadline} />
        </div>

        {!(isFinished || isOverdue) && (
          <button 
            onClick={() => onStatusChange(task.id, 'SELESAI')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FACC15] text-black text-[12px] font-black rounded-xl hover:scale-105 transition-transform shadow-sm"
          >
            <span>Selesai</span>
            <IoChevronForward size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(TaskCard);
