import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, AVATAR_BASE_URL } from '../api';
import { MdArrowBack, MdPhotoCamera, MdCheckCircle, MdDeleteOutline } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-fill state when user data is available
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const getAvatarUrl = () => {
    if (selectedImage) return selectedImage;
    if (user?.avatar) {
      // Pastikan URL selalu segar dengan timestamp
      return `${AVATAR_BASE_URL}${user.avatar}?t=${new Date().getTime()}`;
    }
    return null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Ukuran maksimal foto adalah 2MB');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setBase64Data(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Nama tidak boleh kosong.');
    
    setLoading(true);
    try {
      const payload = { name: name.trim(), email: email.trim() };
      if (base64Data) payload.avatar = base64Data;
      
      await authAPI.updateProfile(payload);
      await refreshUser();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/profile');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await authAPI.deleteAvatar();
      await refreshUser();
      setSelectedImage(null);
      setBase64Data(null);
      setShowConfirmDelete(false);
      toast.success('Foto profil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus foto profil');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-50 sticky top-0 z-10">
        <div className="max-w-[600px] mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 text-slate-800">
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-[15px] font-black text-slate-800 uppercase tracking-widest">Edit Profil</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-[600px] mx-auto p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mt-4 mb-8">
          <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-28 h-28 rounded-full bg-slate-50 flex items-center justify-center text-primary text-4xl font-black border border-slate-100 overflow-hidden shadow-premium">
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
              ) : user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full border-2 border-white flex items-center justify-center shadow-premium">
              <MdPhotoCamera size={18} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
          <p className="text-[10px] text-slate-400 mt-3 font-black uppercase tracking-widest">Ketuk untuk ganti foto</p>
          
          {(user?.avatar || selectedImage) && (
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="mt-2 text-[10px] font-black text-red-500 py-1 px-3 uppercase tracking-widest"
            >
              Hapus Foto
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
            <input 
              className="input bg-[#f8fafc] border-[#e2e8f0] h-14 font-bold" 
              value={name} onChange={e => setName(e.target.value)} 
              placeholder="Masukkan nama" required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <input 
              type="email" 
              className="input bg-[#f8fafc] border-[#e2e8f0] h-14 font-bold" 
              value={email} onChange={e => setEmail(e.target.value)} 
              placeholder="Masukkan email" required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-white text-xs font-black rounded-xl shadow-premium active:scale-95 transition-all disabled:opacity-70 mt-4 uppercase tracking-[0.2em]"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm text-center shadow-premium animate-fade-in">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdCheckCircle size={60} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-widest">Berhasil!</h3>
            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-6 uppercase tracking-widest">
              Profil Anda telah berhasil diperbarui dan disimpan dengan aman.
            </p>
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo Confirm Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm text-center shadow-premium animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdDeleteOutline size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-widest">Hapus Foto?</h3>
            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
              Apakah Anda yakin ingin menghapus foto profil ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl uppercase tracking-widest"
              >
                Batal
              </button>
              <button 
                onClick={handleDeletePhoto}
                className="flex-1 py-3.5 bg-red-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-premium"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
