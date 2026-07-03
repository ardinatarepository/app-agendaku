import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI } from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import { 
  MdAdd, 
  MdClose, 
  MdEdit, 
  MdLabel 
} from 'react-icons/md';
import { IoTrash } from 'react-icons/io5';

const PRESET_COLORS = ['#1E1E1E', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4', '#84cc16'];

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-9 h-9 rounded-full border-2 transition-all duration-300 ${
            value === c ? 'scale-125 ring-2 ring-slate-800 ring-offset-2' : 'hover:scale-110'
          }`}
          style={{
            backgroundColor: c,
            borderColor: 'white',
          }}
        />
      ))}
      <div className="relative w-9 h-9 rounded-full border-2 border-slate-100 overflow-hidden group">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full scale-150 cursor-pointer" 
          title="Warna kustom" 
        />
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();
  const qc        = useQueryClient();

  const [form, setForm]       = useState({ name: '', color: '#1E1E1E' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ name: '', color: '' });
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => categoryAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setEditingId(null);
      toast.success('Kategori diperbarui!');
    },
    onError: () => toast.error('Gagal memperbarui kategori'),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createCat.mutateAsync(form);
    setForm({ name: '', color: '#1E1E1E' });
    setShowForm(false);
  };

  const handleDelete = (id, name, count) => {
    setConfirmDeleteCat({ id, name, count });
  };

  const confirmDelete = () => {
    if (confirmDeleteCat) {
      deleteCat.mutate(confirmDeleteCat.id);
      setConfirmDeleteCat(null);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, color: cat.color });
  };

  const saveEdit = () => {
    if (!editForm.name.trim()) return;
    updateMut.mutate({ id: editingId, data: editForm });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header — White sticky header matching EditProfilePage */}
      <div className="bg-white border-b border-slate-50 sticky top-0 z-20">
        <div className="max-w-[1650px] 2xl:max-w-[1850px] mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-[15px] font-black text-slate-800 tracking-wide">Manajemen Kategori</h1>
          <button 
            onClick={() => setShowForm(s => !s)} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-premium transition-all active:scale-95 ${
              showForm ? 'bg-slate-100 text-slate-400' : 'bg-[#FACC15] text-black'
            }`}
          >
            {showForm ? <MdClose size={22} /> : <MdAdd size={22} />}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1650px] 2xl:max-w-[1850px] mx-auto space-y-8">
        
        {/* Header Action Row */}
        <div className="flex items-center justify-between mt-2 relative z-10 px-2">
          <div className="bg-white px-6 py-4 rounded-xl shadow-premium border border-slate-50 flex items-center gap-3">
             <MdLabel size={24} className="text-slate-400" />
             <div>
               <h2 className="text-[10px] font-black text-slate-800 tracking-wide leading-none">{categories.length} Kategori</h2>
               <p className="text-[10px] font-bold text-slate-400 tracking-wide mt-1">Organisir tugas Anda</p>
             </div>
          </div>
        </div>

        {/* Form tambah */}
        {showForm && (
          <div className="bg-white rounded-xl p-8 shadow-premium border border-slate-100 animate-fade-in">
            <h3 className="text-[10px] font-black text-slate-800 tracking-wide mb-6 flex items-center gap-2">
               <div className="w-1 h-4 bg-[#FACC15] rounded-full" /> Tambah Kategori Baru
            </h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-wide ml-1 mb-2 block">Nama Kategori</label>
                <input 
                  className="input h-14 bg-slate-50 border-transparent focus:bg-white font-normal placeholder:font-normal" 
                  placeholder="Contoh: Skripsi, Hobi, Kerja..." 
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} 
                  maxLength={50} required autoFocus 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 tracking-wide ml-1 mb-2 block">Pilih Warna</label>
                <ColorPicker value={form.color} onChange={(c) => setForm(f => ({ ...f, color: c }))} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl tracking-wide">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-[#FACC15] text-black text-[10px] font-black rounded-xl tracking-wide shadow-premium active:scale-95 transition-all disabled:opacity-50" disabled={createCat.isPending || !form.name.trim()}>
                  {createCat.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)
          ) : categories.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-100 rounded-xl shadow-sm">
              <MdLabel size={64} className="mx-auto text-slate-100 mb-6" />
              <p className="text-lg font-black text-slate-300 tracking-wide">Belum ada kategori</p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-wide opacity-60">Tambahkan kategori untuk mengorganisir tugasmu.</p>
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl p-6 shadow-premium border border-slate-100 group hover:shadow-premium-hover transition-all duration-300">
                {editingId === cat.id ? (
                  // Mode edit
                  <div className="space-y-4">
                    <input className="input h-12 bg-slate-50 border-transparent font-normal placeholder:font-normal text-sm" value={editForm.name}
                      onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                    <ColorPicker value={editForm.color} onChange={(c) => setEditForm(f => ({ ...f, color: c }))} />
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-2 text-slate-500 text-[10px] font-black rounded-xl border border-slate-100 tracking-wide">Batal</button>
                      <button onClick={saveEdit} className="flex-1 py-2 bg-[#FACC15] text-black text-[10px] font-black rounded-xl tracking-wide shadow-premium" disabled={updateMut.isPending}>
                        {updateMut.isPending ? 'Simpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode normal
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5" style={{ backgroundColor: `${cat.color}15` }}>
                       <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 tracking-wide truncate">{cat.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-wide mt-1">{cat._count?.tasks ?? 0} tugas aktif</p>
                    </div>
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(cat)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-[#1E1E1E] transition-colors" title="Edit">
                        <MdEdit size={18} />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name, cat._count?.tasks ?? 0)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:text-red-500 transition-colors" title="Hapus">
                        <IoTrash size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Category Confirmation */}
      <ConfirmModal
        visible={!!confirmDeleteCat}
        title="Hapus Kategori?"
        message={`Apakah Anda yakin ingin menghapus kategori "${confirmDeleteCat?.name}"? ${confirmDeleteCat?.count > 0 ? `${confirmDeleteCat.count} tugas terkait tidak akan dihapus.` : ''}`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteCat(null)}
      />
    </div>
  );
}
