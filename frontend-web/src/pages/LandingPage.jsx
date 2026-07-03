import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoArrowForward, 
  IoCalendarOutline, 
  IoTimeOutline, 
  IoFlagOutline, 
  IoLayersOutline,
  IoChevronForward,
  IoRemoveOutline,
  IoAddOutline
} from 'react-icons/io5';
import Logo from '../components/common/Logo';
import { parseNaturalLanguage } from '../utils/smartParser';

export default function LandingPage() {
  const [nlpInput, setNlpInput] = useState('Kirim laporan keuangan besok jam 10:00 prioritas tinggi');
  
  // Dummy categories for parser
  const dummyCategories = [
    { id: '1', name: 'Kerja', color: '#3B82F6' },
    { id: '2', name: 'Belajar', color: '#10B981' },
    { id: '3', name: 'Keuangan', color: '#EF4444' }
  ];

  const parsed = parseNaturalLanguage(nlpInput, dummyCategories) || {
    deadline: null,
    time: null,
    priority: null,
    summary: 'Mulai mengetik untuk melihat deteksi otomatis...'
  };

  const formatPriority = (prio) => {
    if (prio === 'TINGGI') return 'Tinggi';
    if (prio === 'RENDAH') return 'Rendah';
    return 'Normal';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans text-[#1A1A1A]">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo />


          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold hover:opacity-75 transition-opacity">
              Masuk
            </Link>
            <Link 
              to="/register" 
              className="text-sm font-bold bg-[#FACC15] text-[#1A1A1A] px-5 py-2.5 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Bento Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-16 w-full">
        {/* Split Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-7">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-[#1A1A1A] uppercase">
              Atur Agendamu <br />
              <span className="text-[#FACC15]">dengan lebih mudah</span>
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pt-4 flex flex-col items-start text-left">
            <p className="text-lg font-medium text-slate-500 mb-8 leading-relaxed">
              AgendaKu membantu Anda merencanakan, membuat, serta mengatur agenda harian tanpa drama. Say goodbye pada drama pencatatan agenda harianmu.
            </p>
            <div className="flex flex-wrap items-center gap-4 w-full">
              <Link 
                to="/register" 
                className="flex items-center gap-2 bg-[#1A1A1A] text-[#FACC15] border-2 border-black px-6 py-3.5 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all"
              >
                Mulai Sekarang
              </Link>
            </div>
          </div>
        </section>

        {/* Bento Grid Layout */}
        <section id="fitur" className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* Card 1: NLP Parser Demo (Left, spans 8 cols) */}
          <div id="demo" className="lg:col-span-8 bg-white border-2 border-black rounded-2xl p-8 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between">
            <div>
              <div className="mb-6 h-2"></div>
              
              <h2 className="text-2xl sm:text-3xl font-black mb-4 uppercase tracking-tight">Deteksi Tugas Otomatis</h2>
              <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed max-w-xl">
                Cukup ketik nama tugas beserta keterangannya, dan biarkan AgendaKu menyiapkan tugas anda.
              </p>

              {/* Interactive Demo */}
              <div className="bg-[#FAF9F6] border-2 border-black rounded-xl p-4 sm:p-6 mb-8">
                <label className="block text-sm font-bold text-[#1A1A1A] mb-2">Coba Ketik Sesuatu:</label>
                <input 
                  type="text" 
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder="Contoh: Belajar Bab 3 besok jam 08:00 prioritas tinggi"
                  className="w-full bg-white border-2 border-black rounded-lg px-4 py-3 font-bold text-sm outline-none focus:bg-yellow-50/20 transition-all placeholder:text-slate-300"
                />

                {/* Parsed Result Display */}
                <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
                  <span className="block text-sm font-bold text-[#1A1A1A] mb-3">Hasil:</span>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white border-2 border-black px-4 py-2 rounded-lg flex items-center gap-2">
                      <IoCalendarOutline size={16} />
                      <span className="text-xs font-bold">{parsed.deadline || 'Tanpa Tanggal'}</span>
                    </div>
                    <div className="bg-white border-2 border-black px-4 py-2 rounded-lg flex items-center gap-2">
                      <IoTimeOutline size={16} />
                      <span className="text-xs font-bold">{parsed.time || 'Tanpa Jam'}</span>
                    </div>
                    <div className="bg-white border-2 border-black px-4 py-2 rounded-lg flex items-center gap-2">
                      <IoFlagOutline size={16} />
                      <span className="text-xs font-bold">{formatPriority(parsed.priority)}</span>
                    </div>
                    {parsed.categoryId && (
                      <div className="bg-white border-2 border-black px-4 py-2 rounded-lg flex items-center gap-2">
                        <IoLayersOutline size={16} />
                        <span className="text-xs font-bold">
                          {dummyCategories.find(c => c.id === parsed.categoryId)?.name || 'Kategori'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Right Column: Stacked Cards (Spans 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Card 2: Simple Management (Yellow Background) */}
            <div className="bg-[#FACC15] border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black uppercase tracking-tight leading-none text-[#1A1A1A]">
                  Sederhana &<br />Teratur
                </h3>
                <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  <IoRemoveOutline size={18} />
                </div>
              </div>
              <p className="text-xs font-bold text-[#1A1A1A]/80 leading-relaxed mt-4">
                Atur prioritas, catat sub-tugas, dan pantau penyelesaian agenda harian Anda dengan antarmuka yang efisien dan to-the-point.
              </p>
            </div>

            {/* Card 3: Premium Design (White Background) */}
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between min-h-[220px]">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                  Desain<br />Premium
                </h3>
                <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  <IoAddOutline size={18} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 leading-relaxed mt-4">
                Nikmati pengalaman produktivitas dengan estetika minimalis, modern, dan performa website yang super responsif di semua platform.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="tentang" className="bg-white py-10 border-t-2 border-black text-center mt-20 shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" showText={false} className="scale-75 origin-left" />
          <p className="text-xs font-bold text-slate-400">
            &copy; {new Date().getFullYear()} AgendaKu. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
