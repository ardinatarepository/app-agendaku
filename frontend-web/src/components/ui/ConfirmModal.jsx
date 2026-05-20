import { IoTrashOutline, IoWarningOutline } from 'react-icons/io5';

export default function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Hapus', 
  cancelText = 'Batal', 
  variant = 'danger',
  icon
}) {
  if (!visible) return null;

  const iconColor = {
    danger: 'bg-red-50 text-red-500',
    primary: 'bg-amber-50 text-[#FACC15]',
    warning: 'bg-amber-50 text-[#FACC15]'
  }[variant] || 'bg-red-50 text-red-500';

  const btnColor = {
    danger: 'bg-red-500 text-white shadow-red-200 hover:bg-red-600',
    primary: 'bg-[#FACC15] text-black shadow-[#FACC15]/20 hover:bg-[#EAB308]',
    warning: 'bg-[#FACC15] text-black shadow-[#FACC15]/20 hover:bg-[#EAB308]'
  }[variant] || 'bg-red-500 text-white shadow-red-200 hover:bg-red-600';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-10 text-center shadow-2xl animate-scale-in border border-slate-50">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${iconColor}`}>
          {icon || (variant === 'danger' ? <IoTrashOutline size={40} /> : <IoWarningOutline size={40} />)}
        </div>
        <h3 className="text-xl font-bold text-black mb-3 tracking-tight">{title}</h3>
        <p className="text-[14px] text-slate-400 font-medium leading-relaxed mb-10 px-2">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className={`w-full h-14 rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center ${btnColor}`}
          >
            {confirmText}
          </button>
          <button 
            onClick={onCancel} 
            className="w-full h-14 bg-white text-slate-400 rounded-2xl text-[14px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all border-none"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
