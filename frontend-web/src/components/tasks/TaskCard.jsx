import { useState } from 'react';
import { 
  MdCheck, 
  MdEdit, 
  MdDelete, 
  MdEvent, 
  MdAccessTime, 
  MdError, 
  MdChevronRight,
  MdPlaylistAddCheck,
  MdAlarm,
  MdAdd
} from 'react-icons/md';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue, isNearDeadline } from '../../utils';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, onToggleSubtask, onAddSubtask }) {
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);
  const sc   = STATUS_CONFIG[task.status];
  const pc   = PRIORITY_CONFIG[task.priority];
  const overdue     = task.deadline && task.status !== 'SELESAI' && isOverdue(task.deadline);
  const nearDl      = task.deadline && task.status !== 'SELESAI' && isNearDeadline(task.deadline);
  const done        = task.status === 'SELESAI';
  
  const dlColor     = overdue ? 'text-red-500' : nearDl ? 'text-amber-500' : 'text-slate-400';
  const dlIcon      = overdue ? <MdError size={14} /> : nearDl ? <MdAccessTime size={14} /> : <MdEvent size={14} />;

  const nextStatus  = task.status === 'SELESAI' ? 'SEDANG_DIKERJAKAN' : 'SELESAI';
  const nextLabel   = task.status === 'SELESAI' ? 'Batal' : 'Selesai';

  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-[16px] p-4 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300 ${done ? 'opacity-60' : ''}`}>

      {/* Header */}
      <div className="flex items-start gap-3 mb-2.5">
        <div className="flex-1 min-w-0">
          <h3 className={`font-normal text-[#1e293b] text-sm leading-snug ${done ? 'line-through text-slate-400 font-normal' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
          )}
        </div>

        {/* Actions — always show delete, edit only when not done */}
        <div className="flex items-center gap-1 shrink-0">
          {!done && onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(task); }} 
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-[#1e293b] rounded-xl hover:bg-slate-50 transition-all"
              title="Edit Tugas"
            >
              <MdEdit size={18} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
              className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"
              title="Hapus Tugas"
            >
              <MdDelete size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {task.status !== 'TERLEWAT' && (
          <span className={`${sc.cls} text-[9px] uppercase tracking-wider`}>{sc.label}</span>
        )}
        <span className={`${pc.cls} text-[9px] uppercase tracking-wider`}>{pc.label}</span>
        {task.category && (
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
            style={{ backgroundColor: task.category.color + '15', color: task.category.color }}>
            {task.category.name}
          </span>
        )}
        {task.isRecurring && (
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider bg-blue-50 text-blue-600">
            🔁 {task.recurrence === 'HARIAN' ? 'Harian' : task.recurrence === 'MINGGUAN' ? 'Mingguan' : 'Bulanan'}
          </span>
        )}
      </div>

      {/* Subtasks Progress */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-normal text-slate-500 flex items-center gap-1 cursor-pointer" onClick={() => setShowSubtasks(!showSubtasks)}>
              <MdPlaylistAddCheck size={14} /> Sub-Tugas ({task.subtasks.filter(st => st.isDone).length}/{task.subtasks.length})
            </span>
            <span className="text-[10px] font-normal text-[#15152b]">
              {Math.round((task.subtasks.filter(st => st.isDone).length / task.subtasks.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#15152b] h-full rounded-full transition-all duration-500"
              style={{ width: `${(task.subtasks.filter(st => st.isDone).length / task.subtasks.length) * 100}%` }}
            />
          </div>
          
          {showSubtasks && (
            <div className="mt-2 space-y-1.5">
              {task.subtasks.map(st => (
                <div key={st.id} className="flex items-start gap-2 group">
                  <button 
                    onClick={() => onToggleSubtask && onToggleSubtask(task.id, st.id)}
                    className={`shrink-0 w-4 h-4 rounded-sm border mt-0.5 flex items-center justify-center transition-colors ${
                      st.isDone ? 'bg-[#15152b] border-[#15152b] text-white' : 'border-slate-300 text-transparent hover:border-[#15152b]'
                    }`}
                  >
                    <MdCheck size={10} />
                  </button>
                  <span className={`text-[11px] leading-snug flex-1 ${st.isDone ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                    {st.title}
                  </span>
                </div>
              ))}
              
              {/* Add Subtask Input */}
              {onAddSubtask && !done && (
                <div className="flex items-center gap-1 mt-2">
                  <input 
                    type="text" 
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtask.trim()) {
                        onAddSubtask(task.id, newSubtask.trim());
                        setNewSubtask('');
                      }
                    }}
                    placeholder="Tambah sub-tugas..."
                    className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#15152b]"
                  />
                  <button 
                    onClick={() => {
                      if (newSubtask.trim()) {
                        onAddSubtask(task.id, newSubtask.trim());
                        setNewSubtask('');
                      }
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-[#15152b] text-white rounded hover:bg-[#15152b]/90"
                  >
                    <MdAdd size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2">
        {task.deadline ? (
          <div className="flex flex-col">
            <span className={`text-[10px] font-normal flex items-center gap-1 ${dlColor}`}>
              {dlIcon}
              {overdue ? 'Terlambat · ' : ''}{formatDate(task.deadline)}
            </span>
            {task.reminderHours > 0 && (
              <span className="text-[9px] text-primary font-normal flex items-center gap-1 mt-0.5">
                <MdAlarm size={12} /> Diingatkan {task.reminderHours}j sebelum
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 font-medium italic">Tanpa deadline</span>
        )}

        {!done && (
          <button onClick={() => onStatusChange(task.id, nextStatus)}
            className="flex items-center gap-1 px-3 py-1 bg-[#1e293b]/5 text-[#1e293b] text-[10px] font-bold rounded-full hover:bg-[#1e293b]/10 transition-all">
            {nextLabel} 
            <MdChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
