import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks';
import { 
  MdPerson, 
  MdEmail, 
  MdCameraAlt, 
  MdDelete, 
  MdLogout, 
  MdSecurity, 
  MdNotifications, 
  MdSmartphone,
  MdEdit,
  MdLabel,
  MdSave,
  MdCheck
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { authAPI } from '../api';

const PRESET_COLORS = ['#15152b', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const HARI_OPTIONS = [1, 2, 3];
const JAM_OPTIONS = [
  { label: 'Pagi (07:00)', value: '07' },
  { label: 'Siang (12:00)', value: '12' },
  { label: 'Sore (17:00)', value: '17' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);

  // Notification settings state
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notif_enabled') !== 'false');
  const [notifHari, setNotifHari] = useState(() => parseInt(localStorage.getItem('notif_hari') || '1'));
  const [notifJam, setNotifJam] = useState(() => localStorage.getItem('notif_jam') || '07');
  const [notifSaved, setNotifSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Category State
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#15152b');
  const [editingCat, setEditingCat] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      if (res.data.success) {
        toast.success('Profil diperbarui!');
        window.location.reload(); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCat = async () => {
    if (!catName.trim()) return toast.error('Nama kategori wajib diisi.');
    await createCat.mutateAsync({ name: catName.trim(), color: catColor });
    setCatName('');
    setCatColor('#15152b');
    setShowCatForm(false);
  };

  const handleUpdateCat = async (id) => {
    if (!editingCat.name.trim()) return toast.error('Nama kategori wajib diisi.');
    await updateCat.mutateAsync({ id, data: { name: editingCat.name.trim(), color: editingCat.color } });
    setEditingCat(null);
  };

  const handleDeleteCat = async (id, name) => {
    if (window.confirm(`Hapus kategori "${name}"? Tugas terkait tidak akan dihapus.`)) {
      await deleteCat.mutateAsync(id);
    }
  };

  const handleSaveNotif = () => {
    localStorage.setItem('notif_enabled', String(notifEnabled));
    localStorage.setItem('notif_hari', String(notifHari));
    localStorage.setItem('notif_jam', notifJam);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
    toast.success('Pengaturan notifikasi disimpan!');
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'HAPUS AKUN?\n\nSemua data tugas, sub-tugas, dan kategori Anda akan DIHAPUS PERMANEN.\nTindakan ini TIDAK DAPAT DIBATALKAN.\n\nKetik OK untuk melanjutkan.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      toast.success('Akun berhasil dihapus.');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* ── Kiri: Profile Card ── */}
        <div className="md:w-1/3 shrink-0">
          <div className="card p-8 text-center shadow-premium bg-white sticky top-10">
            <div className="relative inline-block mx-auto mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl sm:text-4xl font-black border-4 border-white shadow-xl overflow-hidden">
                {user?.avatar ? (
                  <img src={`${import.meta.env.VITE_API_URL}/avatars/${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : user?.name?.[0]?.toUpperCase()}
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 sm:w-10 sm:h-10 bg-primary text-white rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                <MdCameraAlt size={18} />
              </button>
            </div>
            
            <h2 className="text-xl font-black text-slate-800">{user?.name}</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">{user?.email}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dibuat</p>
                <p className="text-xs font-bold text-slate-700">{new Date(user?.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <MdSecurity size={14} /> Akun Aktif
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kanan: Settings ── */}
        <div className="flex-1 space-y-6">
          
          {/* Form Akun */}
          <div className="card p-6 sm:p-8 bg-white shadow-premium">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <MdPerson size={24} className="text-primary" /> Pengaturan Akun
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Nama Lengkap</label>
                  <div className="relative">
                    <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input className="input pl-11" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="label">Alamat Email</label>
                  <div className="relative">
                    <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input className="input pl-11" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="btn-primary px-8 font-black tracking-tight">
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* Pengaturan Notifikasi */}
          <div className="card p-6 sm:p-8 bg-white shadow-premium">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <MdNotifications size={18} /> Pengaturan Notifikasi
            </h3>
            
            <div className="space-y-6">
              {/* Toggle Aktifkan */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Aktifkan Notifikasi</p>
                  <p className="text-xs text-slate-400">Pengingat deadline tugas</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifEnabled(v => !v)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${notifEnabled ? 'bg-[#15152b]' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {notifEnabled && (
                <div className="space-y-6">
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-3">Ingatkan berapa hari sebelum deadline</p>
                    <div className="flex gap-2">
                      {HARI_OPTIONS.map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setNotifHari(h)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            notifHari === h ? 'bg-[#15152b] text-white border-[#15152b] shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          H-{h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-3">Waktu pengiriman notifikasi</p>
                    <div className="space-y-2">
                      {JAM_OPTIONS.map(j => (
                        <button
                          key={j.value}
                          type="button"
                          onClick={() => setNotifJam(j.value)}
                          className={`w-full p-3.5 rounded-xl text-xs font-bold border flex items-center justify-between transition-all ${
                            notifJam === j.value ? 'bg-[#15152b]/5 border-[#15152b] text-[#15152b]' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-200'
                          }`}
                        >
                          {j.label}
                          {notifJam === j.value && <MdCheck size={18} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveNotif}
                className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  notifSaved ? 'bg-emerald-500 text-white' : 'btn-primary'
                }`}
              >
                {notifSaved ? <><MdCheck size={18} /> Tersimpan!</> : <><MdSave size={18} /> Simpan Pengaturan</>}
              </button>
            </div>
          </div>

          {/* Kategori Management */}
          <div className="card p-6 sm:p-8 bg-white shadow-premium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MdLabel size={18} /> Kategori
              </h3>
              <button onClick={() => setShowCatForm(!showCatForm)} className="text-xs font-bold text-[#15152b] hover:text-[#15152b]/70">
                {showCatForm ? '✕ Tutup' : '+ Tambah'}
              </button>
            </div>

            {showCatForm && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <input 
                  value={catName} onChange={e => setCatName(e.target.value)} 
                  placeholder="Nama kategori..." className="input mb-3 bg-white" autoFocus 
                />
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setCatColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform ${catColor === c ? 'scale-125 border-slate-700' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={handleSaveCat} disabled={createCat.isPending} className="btn-primary w-full py-2.5 text-sm font-black">
                  {createCat.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {catLoading ? (
                <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}</div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-center text-slate-400 py-4">Belum ada kategori. Tambahkan kategori untuk mengorganisir tugasmu.</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="p-3 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors bg-white group">
                    {editingCat?.id === cat.id ? (
                      <div>
                        <input 
                          value={editingCat.name} onChange={e => setEditingCat({...editingCat, name: e.target.value})} 
                          className="input mb-3 py-1.5 px-3 text-sm" autoFocus 
                        />
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PRESET_COLORS.map(c => (
                            <button key={c} onClick={() => setEditingCat({...editingCat, color: c})} className={`w-6 h-6 rounded-full border-2 ${editingCat.color === c ? 'scale-125 border-slate-700' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateCat(cat.id)} className="flex-1 py-1.5 bg-[#15152b] text-white text-xs font-bold rounded-lg hover:bg-[#15152b]/80">Simpan</button>
                          <button onClick={() => setEditingCat(null)} className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{cat.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5">{cat._count?.tasks ?? 0} tugas</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingCat(cat)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors"><MdEdit size={16} /></button>
                          <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><MdDelete size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button onClick={handleLogout} className="flex-1 card p-4 text-center hover:bg-slate-50 font-black text-sm text-slate-600 flex items-center justify-center gap-2 transition-colors">
              <MdLogout size={20} /> Keluar
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex-1 card p-4 text-center border-red-100 hover:bg-red-50 text-red-500 font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <MdDelete size={20} /> {deleting ? 'Menghapus...' : 'Hapus Akun'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
