// LoginPage - Responsif + show/hide password + lupa password

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  MdEmail, 
  MdLock, 
  MdVisibility, 
  MdVisibilityOff, 
  MdArrowForward 
} from 'react-icons/md';

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Selamat datang kembali!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email atau password salah.');
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
          <p className="text-sm text-slate-400 mt-2 font-medium">Kelola tugas & jadwalmu dengan mudah</p>
        </div>

        <div className="card p-8 bg-white/80 backdrop-blur-xl shadow-premium border-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Alamat Email</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input type="email" className="input pl-11" placeholder="email@contoh.com" value={form.email} onChange={set('email')} required autoFocus />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" onClick={() => toast('Hubungi admin untuk reset password.')} className="text-[11px] text-primary hover:underline font-bold">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pl-11 pr-11"
                  placeholder="••••••••"
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
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 mt-2 font-black tracking-tight text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group">
              {loading ? 'Masuk...' : 'Masuk Sekarang'}
              {!loading && <MdArrowForward size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400 font-medium">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary font-black hover:underline underline-offset-4">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
