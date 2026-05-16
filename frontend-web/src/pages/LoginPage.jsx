import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  MdVisibility, 
  MdVisibilityOff, 
  MdErrorOutline
} from 'react-icons/md';

import Logo from '../components/common/Logo';

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
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
      setErrorMsg(err.response?.data?.message || 'Email atau password yang Anda masukkan salah. Silakan coba lagi.');
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
          <p className="text-sm font-medium text-slate-500">Kelola tugas & jadwalmu dengan mudah</p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-10 rounded-[32px] shadow-premium border border-slate-50">
          <h2 className="text-xl font-black text-slate-800 mb-8">Masuk</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-2 block ml-1">Email</label>
              <input 
                type="email" 
                className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none" 
                placeholder="email@contoh.com" 
                value={form.email} 
                onChange={set('email')} 
                required 
                autoFocus 
              />
            </div>
            
            <div>
              <label className="text-sm font-bold text-slate-400 mb-2 block ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  placeholder="Password kamu"
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
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-16 bg-[#1E1E1E] text-white rounded-[20px] text-base font-black shadow-premium active:scale-95 transition-all flex items-center justify-center mt-4"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            Belum punya akun?{' '}
            <Link to="/register" className="text-slate-800 font-black hover:underline underline-offset-4">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setErrorMsg(null)} />
          <div className="bg-white w-full max-w-xs rounded-[40px] p-10 relative z-10 shadow-2xl text-center animate-scale-in">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdErrorOutline className="text-red-500" size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-3">Login Gagal</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8 px-2">
              {errorMsg}
            </p>
            <button 
              onClick={() => setErrorMsg(null)}
              className="w-full py-4 bg-[#1E1E1E] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium active:scale-95 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
