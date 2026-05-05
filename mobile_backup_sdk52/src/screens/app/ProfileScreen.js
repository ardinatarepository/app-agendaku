// ProfileScreen - Updated
// Perubahan: pengaturan notifikasi (H-1/H-2/H-3, jam, toggle), edit kategori, hapus akun

import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Alert, StyleSheet, TextInput, Switch, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI, taskAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Button, EmptyState, ConfirmModal, Toast } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW } from '../../utils/theme';
import { rescheduleAllNotifications, cancelTaskNotification, sendTestNotification } from '../../utils/notifications';

const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const HARI_OPTIONS  = [1, 2, 3];
const JAM_OPTIONS   = [
  { label: 'Pagi (07:00)',  value: '07' },
  { label: 'Siang (12:00)', value: '12' },
  { label: 'Sore (17:00)',  value: '17' },
];
const SectionHeader = ({ title, noMarginTop }) => (
  <Text style={[s.sectionLabel, noMarginTop && { marginTop: 0 }]}>{title}</Text>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null); // { id, name, taskCount }
  const [toast,           setToast]           = useState({ visible: false, message: '', type: 'success' });
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  // Kategori state
  const [catName,  setCatName]  = useState('');
  const [catColor, setCatColor] = useState('#6366f1');
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat,  setEditingCat]  = useState(null); // { id, name, color }

  // Notifikasi state
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifHari,    setNotifHari]    = useState(1);
  const [notifJam,     setNotifJam]     = useState('07');
  const [notifSaved,   setNotifSaved]   = useState(false);

  // Load pengaturan notifikasi dari AsyncStorage
  useEffect(() => {
    AsyncStorage.multiGet(['notif_enabled', 'notif_hari', 'notif_jam']).then(vals => {
      const map = Object.fromEntries(vals.map(([k, v]) => [k, v]));
      if (map.notif_enabled !== null) setNotifEnabled(map.notif_enabled === 'true');
      if (map.notif_hari)    setNotifHari(parseInt(map.notif_hari));
      if (map.notif_jam)     setNotifJam(map.notif_jam);
    }).catch(() => {});
  }, []);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoryAPI.getAll().then(r => r.data.data),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', {}],
    queryFn:  () => taskAPI.getAll({}).then(r => r.data.data),
  });

  const createMut = useMutation({
    mutationFn: (data) => categoryAPI.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setCatName(''); setCatColor('#6366f1'); setShowCatForm(false); },
  });
  const updateCatMut = useMutation({
    mutationFn: ({ id, data }) => categoryAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setEditingCat(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => categoryAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const handleSaveNotif = async () => {
    await AsyncStorage.multiSet([
      ['notif_enabled', String(notifEnabled)],
      ['notif_hari',    String(notifHari)],
      ['notif_jam',     notifJam],
    ]);
    if (notifEnabled && allTasks.length) {
      await rescheduleAllNotifications(allTasks).catch(() => {});
    }
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const handleDeleteCat = (id, name, taskCount) => {
    setConfirmDeleteCat({ id, name, taskCount });
  };

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    setToast({ visible: true, message: 'Fitur hapus akun akan segera tersedia.', type: 'info' });
  };

  const handleSync = async () => {
    try {
      await rescheduleAllNotifications([]);
      setToast({ visible: true, message: 'Sinkronisasi notifikasi berhasil!', type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: 'Gagal sinkronisasi notifikasi.', type: 'danger' });
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header Bar */}
      <View style={s.headerBar}>
        <Text style={s.headerTitle}>Profil & Pengaturan</Text>
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
 
      {/* ── Info Akun ── */}
      <Card style={{ marginBottom: 24, padding: 20, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <View style={[s.avatar, { width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }]}>
            {user?.avatar ? (
              <Image 
                source={{ uri: `http://10.0.2.2:5000/uploads/avatars/${user.avatar}` }} 
                style={{ width: '100%', height: '100%' }} 
              />
            ) : (
              <Text style={[s.avatarText, { fontSize: 28 }]}>{user?.name?.[0]?.toUpperCase()}</Text>
            )}
          </View>
          <View style={s.userInfo}>
            <Text style={[s.userName, { fontSize: 18 }]}>{user?.name}</Text>
            <Text style={[s.userEmail, { fontSize: 14 }]}>{user?.email}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={{ backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }} 
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={{ fontSize: 14, color: COLORS.text, ...FONT.semibold }}>Edit Profil</Text>
        </TouchableOpacity>
      </Card>

      {/* ── Pengaturan Notifikasi ── */}
      <SectionHeader title="Pengaturan Notifikasi" />
      <Card style={s.card}>
        {/* Toggle global */}
        <View style={s.notifRow}>
          <View>
            <Text style={s.notifLabel}>Aktifkan Notifikasi</Text>
            <Text style={s.notifSub}>Pengingat deadline tugas</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
            thumbColor={notifEnabled ? COLORS.primary : COLORS.textLight}
          />
        </View>

        {notifEnabled && (
          <>
            {/* Pilih H-n */}
            <Text style={[s.notifLabel, { marginTop: 16, marginBottom: 8 }]}>Ingatkan berapa hari sebelum deadline</Text>
            <View style={s.hariRow}>
              {HARI_OPTIONS.map(h => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setNotifHari(h)}
                  style={[s.hariBtn, notifHari === h && s.hariBtnActive]}
                >
                  <Text style={[s.hariBtnText, notifHari === h && s.hariBtnTextActive]}>H-{h}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pilih jam */}
            <Text style={[s.notifLabel, { marginTop: 14, marginBottom: 8 }]}>Waktu pengiriman notifikasi</Text>
            <View style={s.jamRow}>
              {JAM_OPTIONS.map(j => (
                <TouchableOpacity
                  key={j.value}
                  onPress={() => setNotifJam(j.value)}
                  style={[s.jamBtn, notifJam === j.value && s.jamBtnActive]}
                >
                  <Text style={[s.jamBtnText, notifJam === j.value && s.jamBtnTextActive]}>{j.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={[s.saveNotifBtn, notifSaved && { backgroundColor: COLORS.success }]} onPress={handleSaveNotif}>
          <Text style={s.saveNotifText}>{notifSaved ? '✓ Tersimpan!' : 'Simpan Pengaturan'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[s.saveNotifBtn, { backgroundColor: '#f1f5f9', marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' }]} 
          onPress={async () => {
            const ok = await sendTestNotification();
            if (ok) setToast({ visible: true, message: 'Tunggu 5 detik, notifikasi uji akan muncul.', type: 'success' });
            else setToast({ visible: true, message: 'Izin notifikasi ditolak.', type: 'danger' });
          }}
        >
          <Text style={[s.saveNotifText, { color: '#64748b' }]}>Kirim Notifikasi Uji</Text>
        </TouchableOpacity>
      </Card>

      {/* ── Kategori ── */}
      <View style={[s.sectionHeader, { marginTop: 16 }]}>
        <SectionHeader title="Kategori" noMarginTop />
        <TouchableOpacity onPress={() => setShowCatForm(f => !f)}>
          <Text style={s.addLink}>{showCatForm ? '✕ Tutup' : '+ Tambah'}</Text>
        </TouchableOpacity>
      </View>

      {/* Form tambah */}
      {showCatForm && (
        <Card style={[s.card, { gap: 12 }]}>
          <TextInput
            placeholder="Nama kategori..."
            placeholderTextColor={COLORS.textLight}
            value={catName}
            onChangeText={setCatName}
            style={s.catInput}
            autoFocus
            maxLength={50}
          />
          <View style={s.colorRow}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCatColor(c)}
                style={[s.colorDot, { backgroundColor: c }, catColor === c && s.colorDotActive]}
              />
            ))}
          </View>
          <Button
            title={createMut.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
            onPress={() => {
              if (!catName.trim()) { 
              setToast({ visible: true, message: 'Nama kategori wajib diisi.', type: 'danger' });
              return; 
            }
              createMut.mutate({ name: catName.trim(), color: catColor });
            }}
            loading={createMut.isPending}
          />
        </Card>
      )}

      {/* List kategori */}
      {isLoading ? (
        [...Array(3)].map((_, i) => <View key={i} style={s.skeleton} />)
      ) : categories.length === 0 ? (
        <EmptyState emoji="🏷️" title="Belum ada kategori" subtitle="Tambahkan kategori untuk mengorganisir tugasmu." />
      ) : (
        categories.map(cat => {
          const isEditing = editingCat?.id === cat.id;
          return (
            <Card key={cat.id} style={[s.card, s.catCard]}>
              {isEditing ? (
                // Mode edit
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={editingCat.name}
                    onChangeText={v => setEditingCat(e => ({ ...e, name: v }))}
                    style={s.catInput}
                    autoFocus
                  />
                  <View style={s.colorRow}>
                    {PRESET_COLORS.map(c => (
                      <TouchableOpacity key={c} onPress={() => setEditingCat(e => ({ ...e, color: c }))}
                        style={[s.colorDot, { backgroundColor: c }, editingCat.color === c && s.colorDotActive]} />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[s.editActionBtn, { borderColor: COLORS.border }]} onPress={() => setEditingCat(null)}>
                      <Text style={{ fontSize: 13, color: COLORS.textMuted }}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.editActionBtn, { backgroundColor: COLORS.primary, borderColor: COLORS.primary, flex: 1 }]}
                      onPress={() => updateCatMut.mutate({ id: cat.id, data: { name: editingCat.name, color: editingCat.color } })}
                    >
                      <Text style={{ fontSize: 13, color: '#fff', ...FONT.semibold }}>Simpan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Mode normal
                <View style={s.catRow}>
                  <View style={[s.catDot, { backgroundColor: cat.color }]} />
                  <View style={s.catInfo}>
                    <Text style={s.catName}>{cat.name}</Text>
                    <Text style={s.catCount}>{cat._count?.tasks ?? 0} tugas</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setEditingCat({ id: cat.id, name: cat.name, color: cat.color })} 
                    hitSlop={8} 
                    style={[s.catActBtn, { backgroundColor: '#f1f5f9' }]}
                  >
                    <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteCat(cat.id, cat.name, cat._count?.tasks ?? 0)} 
                    hitSlop={8} 
                    style={[s.catActBtn, { backgroundColor: '#fee2e2' }]}
                  >
                    <MaterialIcons name="delete" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          );
        })
      )}

      {/* ── Pengaturan Akun & App ── */}
      <Card style={[s.card, { marginTop: 24 }]}>
        <TouchableOpacity style={s.menuItem} onPress={() => setToast({ visible: true, message: 'Fitur ubah password akan segera tersedia.', type: 'info' })}>
          <Text style={s.menuLabel}>Ubah Password</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={s.divider} />
        <View style={s.menuItem}>
          <Text style={s.menuLabel}>Versi Aplikasi</Text>
          <Text style={s.menuValue}>AgendaKu v1.0.0</Text>
        </View>
      </Card>

      {/* Logout & Hapus Akun */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Keluar dari AgendaKu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={s.deleteText}>Hapus Akun</Text>
      </TouchableOpacity>

      <Text style={s.version}>AgendaKu v1.0.0 · UNU Yogyakarta</Text>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun AgendaKu? Sesi Anda akan berakhir."
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
        confirmText="Ya, Keluar"
        variant="danger"
        iconName="logout"
      />

      <ConfirmModal
        visible={showDeleteModal}
        title="Hapus Akun?"
        message="Semua data tugas dan kategori Anda akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Ya, Hapus Permanen"
        variant="danger"
        iconName="delete-forever"
      />

      <ConfirmModal
        visible={!!confirmDeleteCat}
        title="Hapus Kategori?"
        message={confirmDeleteCat ? `Apakah Anda yakin ingin menghapus kategori "${confirmDeleteCat.name}"?${confirmDeleteCat.taskCount > 0 ? `\n\nCatatan: ${confirmDeleteCat.taskCount} tugas yang menggunakan kategori ini akan tetap ada.` : ''}` : ''}
        onConfirm={() => {
          deleteMut.mutate(confirmDeleteCat.id);
          setConfirmDeleteCat(null);
        }}
        onCancel={() => setConfirmDeleteCat(null)}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  headerBar: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, ...FONT.bold, color: '#FFF' },
  searchRow: { flexDirection: 'row', gap: 10, padding: 16, marginTop: 10, zIndex: 10 },
  content:        { padding: 20, paddingBottom: 48 },
  userCard:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, padding: 18, marginTop: 10 },
  avatar:         { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 22, ...FONT.bold, color: COLORS.primary },
  userInfo:       { flex: 1 },
  userName:       { fontSize: 17, ...FONT.bold, color: COLORS.text },
  userEmail:      { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  editProfileBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full },
  sectionLabel:   { fontSize: 11, ...FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 28 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 28 },
  addLink:        { fontSize: 13, color: COLORS.primary, ...FONT.semibold },
  card:           { marginBottom: 10, padding: 16 },
  notifRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifLabel:     { fontSize: 14, ...FONT.semibold, color: COLORS.text },
  notifSub:       { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  hariRow:        { flexDirection: 'row', gap: 10 },
  hariBtn:        { paddingVertical: 9, paddingHorizontal: 18, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  hariBtnActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  hariBtnText:    { fontSize: 14, ...FONT.semibold, color: COLORS.textMuted },
  hariBtnTextActive: { color: COLORS.primary },
  jamRow:         { gap: 8 },
  jamBtn:         { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  jamBtnActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  jamBtnText:     { fontSize: 13, color: COLORS.textMuted, ...FONT.medium },
  jamBtnTextActive:{ color: COLORS.primary, ...FONT.semibold },
  saveNotifBtn:   { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  saveNotifText:  { color: '#fff', fontSize: 14, ...FONT.semibold },
  catInput:       { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, height: 44, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.bg },
  colorRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot:       { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { transform: [{ scale: 1.25 }], borderWidth: 2, borderColor: COLORS.text },
  skeleton:       { height: 58, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.lg, marginBottom: 8 },
  catCard:        { marginBottom: 8 },
  catRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  catDot:         { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  catInfo:        { flex: 1 },
  catName:        { fontSize: 15, ...FONT.semibold, color: COLORS.text },
  catCount:       { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  catActBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  catActIcon:     { fontSize: 14, color: COLORS.textMuted },
  editActionBtn:  { paddingVertical: 9, paddingHorizontal: 16, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center' },
  menuItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  menuLabel:      { fontSize: 14, ...FONT.bold, color: COLORS.text },
  menuValue:      { fontSize: 13, color: COLORS.textMuted },
  menuArrow:      { fontSize: 18, color: COLORS.textLight },
  divider:        { height: 1, backgroundColor: COLORS.borderLight },
  logoutBtn:      { marginTop: 16, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.surface },
  logoutText:     { fontSize: 14, color: COLORS.textMuted, ...FONT.medium },
  deleteBtn:      { marginTop: 10, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.danger + '60', alignItems: 'center' },
  deleteText:     { fontSize: 14, color: COLORS.danger, ...FONT.medium },
  version:        { textAlign: 'center', fontSize: 11, color: COLORS.textLight, marginTop: 24 },
});
