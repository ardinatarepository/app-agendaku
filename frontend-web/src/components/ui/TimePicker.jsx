import { useState, useRef, useEffect } from 'react';

export default function TimePicker({ value, onSelect, onClose }) {
  const [hh, mm] = (value || '12:00').split(':');
  const [selectedH, setSelectedH] = useState(hh);
  const [selectedM, setSelectedM] = useState(mm);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const scrollRefH = useRef(null);
  const scrollRefM = useRef(null);
  const touchStartY = useRef(0);

  // Sync scroll position on value change
  useEffect(() => {
    if (scrollRefH.current) scrollRefH.current.scrollTop = hours.indexOf(selectedH) * 44;
    if (scrollRefM.current) scrollRefM.current.scrollTop = mins.indexOf(selectedM) * 44;
  }, [selectedH, selectedM]);

  const handleStep = (type, direction) => {
    if (type === 'H') {
      const currIdx = hours.indexOf(selectedH);
      const nextIdx = Math.max(0, Math.min(hours.length - 1, currIdx + direction));
      setSelectedH(hours[nextIdx]);
    } else {
      const currIdx = mins.indexOf(selectedM);
      const nextIdx = Math.max(0, Math.min(mins.length - 1, currIdx + direction));
      setSelectedM(mins[nextIdx]);
    }
  };

  const onWheel = (e, type) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    handleStep(type, direction);
  };

  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e, type) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (Math.abs(diff) > 20) {
      handleStep(type, diff > 0 ? 1 : -1);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-[340px] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        
        <h3 className="text-center font-bold text-slate-800 text-lg mb-8">Pilih Jam</h3>

        <div className="relative flex justify-center items-center h-[200px] gap-2 overflow-hidden bg-white select-none">
          {/* Highlight Indicator */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-[44px] bg-slate-50 border border-slate-100 rounded-xl z-0" />

          {/* Hours Column */}
          <div 
            ref={scrollRefH}
            onWheel={(e) => onWheel(e, 'H')}
            onTouchStart={onTouchStart}
            onTouchEnd={(e) => onTouchEnd(e, 'H')}
            className="flex-1 h-full overflow-hidden z-10 no-scrollbar cursor-ns-resize"
          >
            <div className="py-[78px] transition-all duration-200">
              {hours.map(h => (
                <div key={h} className={`h-[44px] flex items-center justify-center transition-all duration-200 ${selectedH === h ? 'text-2xl font-bold text-slate-800' : 'text-sm text-slate-300 font-medium'}`}>
                  {h}
                </div>
              ))}
            </div>
          </div>

          <div className="text-2xl font-bold text-slate-800 z-10 mb-1">:</div>

          {/* Minutes Column */}
          <div 
            ref={scrollRefM}
            onWheel={(e) => onWheel(e, 'M')}
            onTouchStart={onTouchStart}
            onTouchEnd={(e) => onTouchEnd(e, 'M')}
            className="flex-1 h-full overflow-hidden z-10 no-scrollbar cursor-ns-resize"
          >
            <div className="py-[78px] transition-all duration-200">
              {mins.map(m => (
                <div key={m} className={`h-[44px] flex items-center justify-center transition-all duration-200 ${selectedM === m ? 'text-2xl font-bold text-slate-800' : 'text-sm text-slate-300 font-medium'}`}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-6 mt-10 pt-6 border-t border-slate-50">
          <button onClick={onClose} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Batal
          </button>
          <button onClick={() => { onSelect(`${selectedH}:${selectedM}`); onClose(); }} className="text-sm font-bold text-slate-800 hover:text-primary transition-colors">
            Pilih
          </button>
        </div>
      </div>
    </div>
  );
}
