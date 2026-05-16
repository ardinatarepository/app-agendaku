import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVATAR_BASE_URL } from '../api';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useTasks } from '../hooks';
import { 
  MdEdit,
  MdDeleteOutline,
  MdCheck,
  MdChevronRight
} from 'react-icons/md';
import { 
  IoNotificationsOutline, 
  IoLayersOutline, 
  IoSettingsOutline, 
  IoLockClosedOutline, 
  IoInformationCircleOutline, 
  IoLogOutOutline, 
  IoTrashOutline,
  IoCameraOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const HARI_OPTIONS = [1, 2, 3];
const JAM_OPTIONS = [
  { label: 'Pagi (07:00)', value: '07' },
  { label: 'Siang (12:00)', value: '12' },
  { label: 'Sore (17:00)', value: '17' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuth();
  const { data: allTasks = [] } = useTasks();

  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notif_enabled') !== 'false');
  const [notifHari, setNotifHari] = useState(() => parseInt(localStorage.getItem('notif_hari') || '1'));
  const [notifJam, setNotifJam] = useState(() => localStorage.getItem('notif_jam') || '07');
  const [notifSaved, setNotifSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: categories = [], isLoading: catLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [editingCat, setEditingCat] = useState(null);

  const handleSaveNotif = () => {
    localStorage.setItem('notif_enabled', String(notifEnabled));
    localStorage.setItem('notif_hari', String(notifHari));
    localStorage.setItem('notif_jam', notifJam);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
    toast.success('Pengaturan notifikasi disimpan!');
  };

  const handleSaveCat = async () => {
    if (!catName.trim()) return toast.error('Nama kategori wajib diisi.');
    await createCat.mutateAsync({ name: catName.trim(), color: catColor });
    setCatName(''); setCatColor('#6366f1'); setShowCatForm(false);
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Akun Anda telah dihapus secara permanen.');
      navigate('/login');
    } catch (err) {
      toast.error('Gagal menghapus akun.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[var(--app-bg)] min-h-screen pb-24 pt-16 font-poppins animate-fade-in antialiased">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT SIDEBAR: ACCOUNT OVERVIEW */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-28 h-28 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-4xl font-bold text-black overflow-hidden mx-auto">
                  {user?.avatar ? (
                    <img src={`${AVATAR_BASE_URL}${user.avatar}?t=${new Date().getTime()}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : user?.name?.[0]?.toUpperCase()}
                </div>
                <button onClick={() => navigate('/edit-profile')} className="absolute bottom-0 right-0 w-10 h-10 bg-[#FACC15] text-black rounded-full shadow-lg border-4 border-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><MdEdit size={18} /></button>
              </div>
              <h2 className="text-[18px] font-bold text-black tracking-tight leading-tight">{user?.name}</h2>
              <p className="text-[13px] font-medium text-slate-400 mt-2 mb-8">{user?.email}</p>
              <div className="space-y-3">
                <button onClick={logout} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-500 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"><IoLogOutOutline size={20} />Keluar Akun</button>
                <button onClick={() => setShowDeleteModal(true)} className="w-full py-4 bg-white border border-red-50 rounded-2xl text-[14px] font-semibold text-red-400 hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><IoTrashOutline size={18} />Hapus Akun</button>
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 overflow-hidden">
              <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest px-3 mb-4">Aplikasi</h3>
              <div className="space-y-1">
                <button onClick={() => navigate('/profile/password')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FEF9C3] group-hover:text-black transition-all">
                      <IoLockClosedOutline size={20} />
                    </div>
                    <span className="text-[14px] font-bold text-black tracking-tight">Ubah Password</span>
                  </div>
                  <MdChevronRight className="text-slate-300" size={24} />
                </button>
                <div className="w-full p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <IoInformationCircleOutline size={22} />
                    </div>
                    <span className="text-[14px] font-bold text-black tracking-tight">Versi Aplikasi</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-300 uppercase tracking-widest">v1.0.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SETTINGS */}
          <div className="lg:col-span-8 space-y-10">
            {/* Notification Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-black">
                  <IoNotificationsOutline size={20} />
                </div>
                <h2 className="text-[16px] font-bold text-black tracking-tight uppercase">Pengaturan Notifikasi</h2>
              </div>
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-black tracking-tight">Aktifkan Notifikasi Pengingat</p>
                    <p className="text-[12px] text-slate-400 font-medium mt-1">Dapatkan pemberitahuan sebelum deadline tugas berakhir</p>
                  </div>
                  <button onClick={() => setNotifEnabled(v => !v)} className={`w-14 h-7 rounded-full p-1.5 transition-colors relative ${notifEnabled ? 'bg-[#FACC15]' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${notifEnabled ? 'translate-x-7' : 'translate-x-0'}`} /></button>
                </div>
                {notifEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 animate-fade-in">
                    <div className="space-y-4">
                      <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Waktu Pengingat (H-n)</p>
                      <div className="flex gap-2">
                        {HARI_OPTIONS.map(h => (
                          <button key={h} onClick={() => setNotifHari(h)} className={`flex-1 py-4 rounded-2xl text-[14px] font-semibold border transition-all ${notifHari === h ? 'bg-[#FEF9C3] text-black border-[#FACC15]' : 'bg-white text-slate-400 border-slate-200'}`}>H-{h}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Pilih Jam Pengiriman</p>
                      <div className="grid grid-cols-1 gap-2">
                        {JAM_OPTIONS.map(j => (
                          <button key={j.value} onClick={() => setNotifJam(j.value)} className={`p-4 rounded-2xl text-[13px] font-medium border flex items-center justify-between transition-all ${notifJam === j.value ? 'bg-[#FEF9C3] border-[#FACC15] text-black font-semibold' : 'bg-white border-slate-200 text-slate-400'}`}>{j.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <button onClick={handleSaveNotif} className={`w-full py-4 rounded-2xl font-bold text-[14px] transition-all shadow-lg ${notifSaved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-[#FACC15] text-black active:scale-95'}`}>{notifSaved ? '✓ Tersimpan' : 'Simpan Pengaturan'}</button>
              </div>
            </section>

            {/* Category Section (Balanced Weights) */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-black">
                    <IoLayersOutline size={20} />
                  </div>
                  <h2 className="text-[16px] font-bold text-black tracking-tight uppercase">Kelola Kategori</h2>
                </div>
                <button onClick={() => setShowCatForm(!showCatForm)} className="text-[12px] font-bold text-black uppercase tracking-widest">{showCatForm ? '✕ Batal' : '+ Tambah'}</button>
              </div>

              {showCatForm && (
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6 animate-fade-in">
                  <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Nama kategori..." className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-[15px] font-semibold outline-none focus:bg-white focus:border-[#FACC15] transition-all" autoFocus />
                  <div className="flex flex-wrap gap-2.5 justify-center py-1">{PRESET_COLORS.map(c => <button key={c} onClick={() => setCatColor(c)} className={`w-9 h-9 rounded-full transition-all ${catColor === c ? 'scale-110 ring-2 ring-black ring-offset-2' : ''}`} style={{ backgroundColor: c }} />)}</div>
                  <button onClick={handleSaveCat} disabled={createCat.isPending} className="w-full py-4 bg-[#FACC15] text-black text-[14px] font-bold rounded-2xl uppercase shadow-lg">{createCat.isPending ? 'Menyimpan...' : 'Simpan Kategori'}</button>
                </div>
              )}

              <div className="space-y-3">
                {catLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-slate-100" />)
                ) : categories.length === 0 ? (
                  <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100"><p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">Belum ada kategori</p></div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 animate-fade-in flex items-center gap-4 group">
                      {editingCat?.id === cat.id ? (
                        <div className="flex-1 space-y-4">
                          <input value={editingCat.name} onChange={e => setEditingCat({...editingCat, name: e.target.value})} className="w-full h-12 px-5 rounded-xl bg-slate-50 border-transparent font-semibold text-[15px] outline-none" autoFocus />
                          <div className="flex flex-wrap gap-2.5">{PRESET_COLORS.map(c => <button key={c} onClick={() => setEditingCat({...editingCat, color: c})} className={`w-7 h-7 rounded-full transition-all ${editingCat.color === c ? 'scale-110 ring-2 ring-black ring-offset-1' : ''}`} style={{ backgroundColor: c }} />)}</div>
                          <div className="flex gap-2.5 pt-2"><button onClick={() => setEditingCat(null)} className="flex-1 py-3 text-slate-400 text-[11px] font-semibold rounded-xl bg-slate-50 uppercase tracking-widest">Batal</button><button onClick={() => handleUpdateCat(cat.id)} className="flex-1 py-3 bg-[#FACC15] text-black text-[11px] font-semibold rounded-xl uppercase tracking-widest">Simpan</button></div>
                        </div>
                      ) : (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-black text-[15px] tracking-tight truncate leading-tight">{cat.name}</h4>
                            <p className="text-[12px] font-medium text-slate-400 mt-1 leading-tight">{cat._count?.tasks ?? 0} tugas</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setEditingCat(cat)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#f1f5f9] text-[#f59e0b] active:scale-90 transition-all"><MdEdit size={18} /></button>
                            <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#fee2e2] text-[#ef4444] active:scale-90 transition-all"><MdDeleteOutline size={18} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Premium Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-10 text-center shadow-2xl scale-up border border-slate-50">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <IoTrashOutline size={40} />
            </div>
            <h3 className="text-xl font-bold text-black mb-3 tracking-tight">Hapus Akun Permanen?</h3>
            <p className="text-[14px] text-slate-400 font-medium leading-relaxed mb-10 px-2">
              Seluruh data tugas, kategori, dan profil Anda akan dihapus selamanya. Tindakan ini <span className="text-red-500 font-bold">tidak bisa dibatalkan.</span>
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount} 
                disabled={isDeleting}
                className="w-full h-14 bg-red-500 text-white rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="w-full h-14 bg-white text-slate-400 rounded-2xl text-[14px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
