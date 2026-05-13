import { useState, useRef, useEffect } from 'react';

export default function TimePicker({ value, onSelect, onClose }) {
  const [hh, mm] = (value || '12:00').split(':');
  const [selectedH, setSelectedH] = useState(hh);
  const [selectedM, setSelectedM] = useState(mm);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const scrollRefH = useRef(null);
  const scrollRefM = useRef(null);

  // Auto scroll to current value on open
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRefH.current) {
        const idx = hours.indexOf(selectedH);
        scrollRefH.current.scrollTop = idx * 44;
      }
      if (scrollRefM.current) {
        const idx = mins.indexOf(selectedM);
        scrollRefM.current.scrollTop = idx * 44;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (ref, setter, items) => {
    const scrollTop = ref.current.scrollTop;
    const idx = Math.round(scrollTop / 44);
    if (items[idx] && items[idx] !== (ref === scrollRefH ? selectedH : selectedM)) {
      setter(items[idx]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-[340px] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        
        <h3 className="text-center font-bold text-slate-800 text-lg mb-8">Pilih Jam</h3>

        <div className="relative flex justify-center items-center h-[200px] gap-2 overflow-hidden bg-white">
          {/* Highlight Indicator — Precise 44px Height */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-[44px] bg-slate-50 border border-slate-100 rounded-xl z-0" />

          {/* Hours */}
          <div 
            ref={scrollRefH}
            onScroll={() => handleScroll(scrollRefH, setSelectedH, hours)}
            className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory z-10 no-scrollbar select-none"
            style={{ scrollPadding: '78px 0' }}
          >
            <div className="py-[78px]">
              {hours.map(h => (
                <div key={h} className={`h-[44px] flex items-center justify-center snap-center transition-all duration-200 ${selectedH === h ? 'text-2xl font-bold text-slate-800' : 'text-sm text-slate-300 font-medium'}`}>
                  {h}
                </div>
              ))}
            </div>
          </div>

          <div className="text-2xl font-bold text-slate-800 z-10 mb-1">:</div>

          {/* Minutes */}
          <div 
            ref={scrollRefM}
            onScroll={() => handleScroll(scrollRefM, setSelectedM, mins)}
            className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory z-10 no-scrollbar select-none"
            style={{ scrollPadding: '78px 0' }}
          >
            <div className="py-[78px]">
              {mins.map(m => (
                <div key={m} className={`h-[44px] flex items-center justify-center snap-center transition-all duration-200 ${selectedM === m ? 'text-2xl font-bold text-slate-800' : 'text-sm text-slate-300 font-medium'}`}>
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
