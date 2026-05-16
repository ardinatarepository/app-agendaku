import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdLockOutline, 
  MdVisibility, 
  MdVisibilityOff, 
  MdArrowBack, 
  MdCheckCircle 
} from 'react-icons/md';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.newPassword.length < 6) {
      return toast.error('Password baru minimal 6 karakter.');
    }
    if (form.newPassword !== form.confirmPassword) {
      return toast.error('Konfirmasi password tidak cocok.');
    }
    if (form.newPassword === form.currentPassword) {
      return toast.error('Password baru tidak boleh sama dengan password lama.');
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setSuccess(true);
      toast.success('Password berhasil diperbarui!');
      setTimeout(() => navigate('/profile'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password. Pastikan password lama benar.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-premium">
          <MdCheckCircle size={60} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-widest">Berhasil Diperbarui!</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-sm mx-auto mb-10">
          Password Anda telah berhasil diubah. Halaman akan otomatis kembali ke Profil dalam beberapa detik.
        </p>
        <button 
          onClick={() => navigate('/profile')}
          className="w-full max-w-xs py-4 bg-[#1E1E1E] text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-premium active:scale-95 transition-all"
        >
          Kembali ke Profil Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Header — Solid Primary matching mobile */}
      <div className="bg-[#1E1E1E] px-6 pt-16 pb-14 rounded-b-xl shadow-premium text-center flex items-center justify-between">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-xl font-black text-white uppercase tracking-widest">Ubah Password</h1>
        <div className="w-10" />
      </div>

      <div className="p-6 max-w-[600px] mx-auto space-y-6">
        <div className="bg-white rounded-xl p-8 shadow-premium border border-slate-100 relative overflow-hidden mt-[-2rem] z-10">
          {/* Decorative Accessnt */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1E1E1E]/5 rounded-full -mr-16 -mt-16" />
          
          <div className="relative">
            <div className="w-16 h-16 bg-[#1E1E1E]/5 text-[#1E1E1E] rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <MdLockOutline size={32} />
            </div>

            <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-widest">Keamanan Akun</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10 leading-relaxed">
              Demi keamanan, gunakan kombinasi huruf dan angka yang sulit ditebak orang lain.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Password Saat Ini</label>
                <div className="relative">
                  <MdLockOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                  <input 
                    type={showCurrent ? "text" : "password"}
                    className="input pl-11 pr-11 bg-slate-50 border-transparent focus:bg-white font-bold" 
                    placeholder="Masukkan password lama"
                    value={form.currentPassword}
                    onChange={e => setForm({...form, currentPassword: e.target.value})}
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Password Baru</label>
                <div className="relative">
                  <MdLockOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                  <input 
                    type={showNew ? "text" : "password"}
                    className="input pl-11 pr-11 bg-slate-50 border-transparent focus:bg-white font-bold" 
                    placeholder="Minimal 6 karakter"
                    value={form.newPassword}
                    onChange={e => setForm({...form, newPassword: e.target.value})}
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Konfirmasi Password Baru</label>
                <div className="relative">
                  <MdLockOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
                  <input 
                    type={showNew ? "text" : "password"}
                    className="input pl-11 bg-slate-50 border-transparent focus:bg-white font-bold" 
                    placeholder="Ulangi password baru"
                    value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-[#1E1E1E] text-white text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-premium active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
              >
                {loading ? 'Memproses...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>

        <div className="p-8 bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
             <div className="w-1 h-3 bg-amber-500 rounded-full" /> Tips Keamanan
          </h4>
          <ul className="text-[10px] text-slate-500 font-bold uppercase tracking-widest space-y-3 leading-relaxed">
            <li className="flex gap-2"><span>•</span> Jangan gunakan informasi pribadi seperti tanggal lahir.</li>
            <li className="flex gap-2"><span>•</span> Gunakan perpaduan huruf besar, huruf kecil, dan simbol.</li>
            <li className="flex gap-2"><span>•</span> Ganti password Anda secara berkala minimal 6 bulan sekali.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
