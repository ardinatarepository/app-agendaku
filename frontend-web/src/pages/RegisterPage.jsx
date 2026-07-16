import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { IoArrowForward } from 'react-icons/io5';

export default function RegisterPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const { register }                  = useAuth();
  const navigate                      = useNavigate();

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6)  return { label: 'Lemah',  color: 'bg-red-400',     w: 'w-1/3' };
    if (p.length < 10) return { label: 'Sedang', color: 'bg-amber-400',   w: 'w-2/3' };
    return               { label: 'Kuat',   color: 'bg-emerald-400',  w: 'w-full' };
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
            Mulai<br />
            <span className="text-[#FACC15]">Sekarang!</span>
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

          <h1 className="text-[34px] font-black text-center text-[#1A1A1A] mb-8 tracking-tight font-archivo">Daftar</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2 font-archivo">Nama Lengkap</label>
              <input
                className="w-full h-14 px-5 bg-[#EBEBEB] border-2 border-transparent rounded-2xl font-semibold text-[#1A1A1A] placeholder:text-slate-400 focus:outline-none focus:border-black transition-all"
                placeholder="Masukan nama Anda"
                value={form.name}
                onChange={set('name')}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2 font-archivo">Email</label>
              <input
                type="email"
                className="w-full h-14 px-5 bg-[#EBEBEB] border-2 border-transparent rounded-2xl font-semibold text-[#1A1A1A] placeholder:text-slate-400 focus:outline-none focus:border-black transition-all"
                placeholder="nama@email.com"
                value={form.email}
                onChange={set('email')}
                required
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
              {strength && (
                <div className="mt-2 px-1">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">Kekuatan: {strength.label}</span>
                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${strength.color} ${strength.w} transition-all duration-500`} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-2 font-archivo">Konfirmasi Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="w-full h-14 px-5 pr-12 bg-[#EBEBEB] border-2 border-transparent rounded-2xl font-semibold text-[#1A1A1A] placeholder:text-slate-400 focus:outline-none focus:border-black transition-all"
                  placeholder="Ulangi password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <MdVisibilityOff size={20} className="text-[#1A1A1A]" /> : <MdVisibility size={20} className="text-[#1A1A1A]" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#FACC15] text-[#1A1A1A] border-[3px] border-[#1A1A1A] rounded-full font-bold text-base shadow-[0px_4px_0px_0px_#1A1A1A] hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px_#1A1A1A] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center font-archivo"
              >
                {loading ? 'Mendaftar...' : 'Daftar Akun'}
              </button>
            </div>
          </form>

          {/* Switch Link */}
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-slate-400">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-[#1A1A1A] hover:underline font-bold">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
