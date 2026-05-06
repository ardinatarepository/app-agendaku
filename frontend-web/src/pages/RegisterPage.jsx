// RegisterPage - Responsif

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  MdPerson, 
  MdEmail, 
  MdLock, 
  MdVisibility, 
  MdVisibilityOff, 
  MdArrowForward, 
  MdCheck 
} from 'react-icons/md';

export default function RegisterPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { register }            = useAuth();
  const navigate                = useNavigate();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Indikator kekuatan password
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-premium mx-auto mb-6 flex items-center justify-center border border-slate-100">
            <img src="/logo.png" className="w-12 h-12" alt="Logo AgendaKu" />
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight">AgendaKu</h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">Mulai perjalanan produktivitasmu</p>
        </div>

        <div className="card p-8 bg-white/80 backdrop-blur-xl shadow-premium border-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input className="input pl-11" placeholder="Nama kamu" value={form.name} onChange={set('name')} required autoFocus minLength={2} />
              </div>
            </div>
            <div>
              <label className="label">Alamat Email</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input type="email" className="input pl-11" placeholder="email@contoh.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-11 pr-11"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPass ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.w} transition-all duration-500`} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400">{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="label">Konfirmasi Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-11"
                  placeholder="Ulangi password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                />
                {form.confirm && form.password === form.confirm && (
                  <MdCheck className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-2 font-black tracking-tight text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group">
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              {!loading && <MdArrowForward size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400 font-medium">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">
                Masuk Disini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
