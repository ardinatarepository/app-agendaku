import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLock, MdVisibility, MdVisibilityOff, MdArrowBack, MdCheckCircle } from 'react-icons/md';
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <MdCheckCircle size={50} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Berhasil Diperbarui!</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Password Anda telah berhasil diubah. Halaman akan otomatis kembali ke Profil dalam beberapa detik.
        </p>
        <button 
          onClick={() => navigate('/profile')}
          className="btn-primary px-10 py-3"
        >
          Kembali ke Profil Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[600px] mx-auto">
      <button 
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-slate-400 hover:text-primary font-bold text-sm mb-8 transition-colors group"
      >
        <MdArrowBack className="group-hover:-translate-x-1 transition-transform" size={20} /> Kembali ke Profil
      </button>

      <div className="card p-8 sm:p-10 bg-white shadow-premium relative overflow-hidden">
        {/* Dekorasi Aksesn */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
        
        <div className="relative">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <MdLock size={28} />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">Ubah Password</h2>
          <p className="text-sm text-slate-400 font-medium mb-10">
            Demi keamanan, gunakan kombinasi huruf dan angka yang sulit ditebak orang lain.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="label">Password Saat Ini</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type={showCurrent ? "text" : "password"}
                  className="input pl-11 pr-11" 
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
                  {showCurrent ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="label">Password Baru</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type={showNew ? "text" : "password"}
                  className="input pl-11 pr-11" 
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
                  {showNew ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Konfirmasi Password Baru</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type={showNew ? "text" : "password"}
                  className="input pl-11" 
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
              className="btn-primary w-full py-4 font-black text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
           Tips Keamanan
        </h4>
        <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
          <li>Jangan gunakan informasi pribadi seperti tanggal lahir.</li>
          <li>Gunakan perpaduan huruf besar, huruf kecil, dan simbol.</li>
          <li>Ganti password Anda secara berkala minimal 6 bulan sekali.</li>
        </ul>
      </div>
    </div>
  );
}
