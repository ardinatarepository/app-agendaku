import { useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function DatePicker({ value, onSelect, onClose }) {
  const initialDate = value ? new Date(value) : new Date();
  const [curr, setCurr] = useState(initialDate);

  const year = curr.getFullYear();
  const month = curr.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (offset) => {
    setCurr(new Date(year, month + offset, 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-[360px] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
            <MdChevronLeft size={28} className="text-slate-800" />
          </button>
          <h3 className="text-lg font-bold text-slate-800">{MONTHS[month]} {year}</h3>
          <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
            <MdChevronRight size={28} className="text-slate-800" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS.map(d => (
            <div key={d} className="text-[11px] font-bold text-slate-400 uppercase mb-4">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === value;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => onSelect(dateStr)}
                className={`relative aspect-square flex items-center justify-center text-sm rounded-full transition-all group
                  ${isSelected ? 'bg-black text-[#FACC15] shadow-lg scale-110 font-black' : 
                    isToday ? 'bg-[#FEF9C3] text-black font-bold' : 'text-slate-700 hover:bg-slate-50 font-bold'}
                `}
              >
                {day}
                {isToday && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 bg-[#FACC15] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Batal
          </button>
          <button onClick={() => onSelect('')} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
