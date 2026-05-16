import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  MdVisibility, 
  MdVisibilityOff 
} from 'react-icons/md';

import Logo from '../components/common/Logo';

export default function RegisterPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { register }            = useAuth();
  const navigate                = useNavigate();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6)  return { label: 'Lemah', color: 'bg-red-400', w: 'w-1/3' };
    if (p.length < 10) return { label: 'Sedang', color: 'bg-amber-400', w: 'w-2/3' };
    return { label: 'Kuat', color: 'bg-emerald-400', w: 'w-full' };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Password tidak cocok!'); return; }
    if (form.password.length < 6) { toast.error('Password minimal 6 karakter.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Akun berhasil dibuat! Silakan masuk.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand Section */}
        <div className="text-center mb-12">
          <Logo size="lg" stacked={true} className="mb-4" />
          <p className="text-sm font-medium text-slate-500">Mulai kelola tugasmu dengan lebih profesional</p>
        </div>

        {/* Register Card */}
        <div className="bg-white p-10 rounded-[32px] shadow-premium border border-slate-50">
          <h2 className="text-xl font-black text-slate-800 mb-8">Daftar Akun</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-2 block ml-1">Nama Lengkap</label>
              <input 
                className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" 
                placeholder="Nama kamu" 
                value={form.name} 
                onChange={set('name')} 
                required 
                autoFocus 
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-2 block ml-1">Email</label>
              <input 
                type="email" 
                className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" 
                placeholder="email@contoh.com" 
                value={form.email} 
                onChange={set('email')} 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-2 block ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="Min. 6 karakter"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPass ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 px-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kekuatan: {strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.w} transition-all duration-500`} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-400 mb-2 block ml-1">Konfirmasi Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                placeholder="Ulangi password"
                value={form.confirm}
                onChange={set('confirm')}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-16 bg-[#1E1E1E] text-white rounded-[20px] text-base font-black shadow-premium active:scale-95 transition-all flex items-center justify-center mt-4"
            >
              {loading ? 'Mendaftar...' : 'Buat Akun'}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-slate-800 font-black hover:underline underline-offset-4">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
