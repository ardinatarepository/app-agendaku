import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory } from '../hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI } from '../api';
import toast from 'react-hot-toast';
import { 
  MdAdd, 
  MdClose, 
  MdEdit, 
  MdDelete, 
  MdLocalOffer 
} from 'react-icons/md';

const PRESET_COLORS = ['#15152b', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4', '#84cc16'];

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full border-2 transition-all duration-150 cursor-pointer"
          style={{
            backgroundColor: c,
            borderColor: value === c ? '#1e293b' : 'transparent',
            transform: value === c ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer overflow-hidden p-0" title="Warna kustom" />
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();
  const qc        = useQueryClient();

  const [form, setForm]       = useState({ name: '', color: '#15152b' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ name: '', color: '' });

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
    setForm({ name: '', color: '#15152b' });
    setShowForm(false);
  };

  const handleDelete = (id, name, count) => {
    if (!window.confirm(`Hapus kategori "${name}"? ${count > 0 ? `${count} tugas terkait tidak akan dihapus.` : ''}`)) return;
    deleteCat.mutate(id);
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
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Kategori</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Organisir tugas berdasarkan kategori</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className={`btn-${showForm ? 'secondary' : 'primary'} text-xs sm:text-sm flex items-center gap-2 font-bold`}>
          {showForm ? <MdClose size={20} /> : <MdAdd size={20} />} {showForm ? 'Tutup' : 'Kategori Baru'}
        </button>
      </div>

      {/* Form tambah */}
      {showForm && (
        <div className="card p-4 sm:p-5 mb-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Tambah Kategori Baru</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Nama Kategori</label>
              <input className="input text-sm" placeholder="Contoh: Skripsi, Hobi, Kerja..." value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} maxLength={50} required autoFocus />
            </div>
            <div>
              <label className="label">Warna</label>
              <ColorPicker value={form.color} onChange={(c) => setForm(f => ({ ...f, color: c }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Batal</button>
              <button type="submit" className="btn-primary flex-1 text-sm" disabled={createCat.isPending || !form.name.trim()}>
                {createCat.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List kategori */}
      <div className="max-w-2xl space-y-2.5">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)
        ) : categories.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="text-3xl mb-4 text-slate-200 flex justify-center"><MdLocalOffer size={48} /></p>
            <p className="font-semibold text-slate-700 text-sm">Belum ada kategori</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan kategori untuk mengorganisir tugasmu.</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="card p-3 sm:p-4">
              {editingId === cat.id ? (
                // Mode edit
                <div className="space-y-3">
                  <input className="input text-sm" value={editForm.name}
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                  <ColorPicker value={editForm.color} onChange={(c) => setEditForm(f => ({ ...f, color: c }))} />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 text-xs">Batal</button>
                    <button onClick={saveEdit} className="btn-primary flex-1 text-xs" disabled={updateMut.isPending}>
                      {updateMut.isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              ) : (
                // Mode normal
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{cat.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cat._count?.tasks ?? 0} tugas</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(cat)} className="btn-icon w-8 h-8 text-slate-400 hover:text-primary hover:bg-primary/5" title="Edit">
                      <MdEdit size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name, cat._count?.tasks ?? 0)}
                      className="btn-icon w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Hapus">
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
