import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdVisibility, MdVisibilityOff, MdErrorOutline } from 'react-icons/md';

export default function LoginPage() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Selamat datang kembali!');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Email atau password yang Anda masukkan salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#F9F8F4] lg:bg-white">
      {/* ── LEFT PANEL (Branding) ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1A1A1A] flex-col justify-between p-16 relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain shrink-0" />
          <span className="font-black text-xl tracking-tighter text-white font-archivo">
            Agenda<span className="text-[#FACC15]">Ku</span>
          </span>
        </div>

        {/* Main Title & Subtitle */}
        <div className="relative z-10 my-auto">
          <h2 className="text-6xl font-black text-white tracking-tight leading-[1.05] mb-4 font-archivo">
            Selamat<br />
            <span className="text-[#FACC15]">Datang!</span>
          </h2>
          <p className="text-base font-semibold text-white/50 leading-relaxed max-w-sm">
            Mulai kelola Agenda harianmu tanpa drama.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs font-bold text-white/20">&copy; {new Date().getFullYear()} AgendaKu. All Rights Reserved.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo Only */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className="w-11 h-11 object-contain shrink-0" />
              <span className="font-archivo font-black text-[22px] tracking-tighter text-[#1A1A1A]">
                Agenda<span className="text-[#FACC15]">Ku</span>
              </span>
            </div>
          </div>

          <h1 className="text-[34px] font-black text-center text-[#1A1A1A] mb-8 tracking-tight font-archivo">Masuk</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2 font-archivo">Email</label>
              <input
                type="email"
                className="w-full h-14 px-5 bg-[#EBEBEB] border-2 border-transparent rounded-2xl font-semibold text-[#1A1A1A] placeholder:text-slate-400 focus:outline-none focus:border-black transition-all"
                placeholder="nama@email.com"
                value={form.email}
                onChange={set('email')}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2 font-archivo">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full h-14 px-5 pr-12 bg-[#EBEBEB] border-2 border-transparent rounded-2xl font-semibold text-[#1A1A1A] placeholder:text-slate-400 focus:outline-none focus:border-black transition-all"
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <MdVisibilityOff size={20} className="text-[#1A1A1A]" /> : <MdVisibility size={20} className="text-[#1A1A1A]" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#FACC15] text-[#1A1A1A] border-[3px] border-[#1A1A1A] rounded-full font-bold text-base shadow-[0px_4px_0px_0px_#1A1A1A] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px_#1A1A1A] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center font-archivo"
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
            </div>
          </form>

          {/* Switch Link */}
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-slate-400">
              Belum punya akun?{' '}
              <Link to="/register" className="text-[#1A1A1A] hover:underline font-bold">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setErrorMsg(null)} />
          <div className="bg-white w-full max-w-xs rounded-2xl border-2 border-black p-8 relative z-10 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] text-center">
            <div className="w-16 h-16 bg-red-50 border-2 border-black rounded-xl flex items-center justify-center mx-auto mb-5">
              <MdErrorOutline className="text-red-500" size={32} />
            </div>
            <h3 className="text-base font-black text-[#1A1A1A] uppercase tracking-widest mb-2">Login Gagal</h3>
            <p className="text-sm font-semibold text-slate-400 leading-relaxed mb-6 px-2">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="w-full py-3 bg-[#1A1A1A] text-[#FACC15] rounded-xl text-sm font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(250,204,21,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(250,204,21,1)] transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
