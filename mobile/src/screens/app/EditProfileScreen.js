import { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar, ScrollView, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { authAPI } from '../../api';
import { COLORS, FONT, RADIUS, SHADOW } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../components/ui';
import { AVATAR_URL } from '../../config';

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        // Hanya kembali jika bukan penghapusan foto (agar bisa lanjut edit nama dll)
        if (!successMsg.includes('dihapus')) {
          navigation.goBack();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigation]);

  // Helper untuk mendapatkan URL gambar
  const getAvatarUrl = () => {
    if (selectedImage) return selectedImage;
    if (user?.avatar) {
      return `${AVATAR_URL}${user.avatar}?t=${new Date().getTime()}`;
    }
    return null;
  };

  const updateMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: async (response) => {
      console.log('Update Success:', response.data);
      await refreshUser();
      // select: { 
      //   id: true, 
      //   name: true, 
      //   email: true, 
      //   // avatar: true // Dimatikan sementara sampai prisma generate berhasil di sisi user
      // },
      // Reset all queries to ensure new data is fetched everywhere
      queryClient.resetQueries();
      setSuccessMsg('Profil Anda telah berhasil diperbarui dan disimpan dengan aman.');
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.log('Update Error Detail:', error);
      const msg = error.response?.data?.message || error.message || 'Koneksi terputus.';
      setToast({ visible: true, message: `Gagal: ${msg}`, type: 'danger' });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => authAPI.deleteAvatar(),
    onSuccess: async () => {
      await refreshUser();
      setSelectedImage(null);
      setBase64Data(null);
      queryClient.resetQueries();
      setSuccessMsg('Foto profil Anda telah berhasil dihapus.');
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.log('Delete Avatar Error:', error);
      setToast({ visible: true, message: error.response?.data?.message || 'Gagal menghapus foto profil.', type: 'danger' });
    }
  });

  const handlePickImage = async () => {
    console.log('handlePickImage called');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        return setToast({ visible: true, message: 'Aplikasi butuh izin galeri untuk mengganti foto.', type: 'info' });
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        width: 500,
        height: 500,
        base64: true,
      });
  
      console.log('Picker result canceled:', result.canceled);
  
      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        const base64 = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
        setBase64Data(base64);
        console.log('Image selected successfully');
      }
    } catch (error) {
      console.error('Pick Image Error:', error);
      setToast({ visible: true, message: 'Gagal membuka galeri: ' + error.message, type: 'danger' });
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      return setToast({ visible: true, message: 'Nama tidak boleh kosong.', type: 'danger' });
    }
    if (!email.trim() || !email.includes('@')) {
      return setToast({ visible: true, message: 'Format email tidak valid.', type: 'danger' });
    }
    
    const payload = {
      name: name.trim(),
      email: email.trim(),
    };

    if (base64Data) {
      payload.avatar = base64Data;
    }

    updateMutation.mutate(payload);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.headerWrapper}>
        <SafeAreaView edges={['top']}>
          <View style={s.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={s.backBtn} 
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialIcons name="arrow-back" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Edit Profil</Text>
            <View style={{ width: 46 }} />
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={s.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={s.avatarContainer}>
            <TouchableOpacity 
              onPress={handlePickImage} 
              activeOpacity={0.8}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              style={{ zIndex: 100, alignItems: 'center' }}
            >
              <View>
                <View style={s.avatarLarge}>
                  {getAvatarUrl() ? (
                    <Image source={{ uri: getAvatarUrl() }} style={s.avatarImage} />
                  ) : (
                    <Text style={s.avatarLargeText}>{user?.name?.[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={s.cameraIcon}>
                  <MaterialIcons name="photo-camera" size={20} color="#fff" />
                </View>
              </View>
              <Text style={s.avatarNote}>Ketuk untuk ganti foto</Text>
            </TouchableOpacity>
            
            {(user?.avatar || selectedImage) && (
              <TouchableOpacity 
                style={s.deletePhotoBtn} 
                onPress={() => {
                  if (selectedImage && !user?.avatar) {
                    setSelectedImage(null);
                    setBase64Data(null);
                  } else {
                    setShowConfirmModal(true);
                  }
                }}
              >
                <Text style={s.deletePhotoText}>Hapus Foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Nama Lengkap</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <TouchableOpacity 
              style={[s.saveBtn, updateMutation.isPending && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              <Text style={s.saveBtnText}>
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Premium Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalIconContainer}>
              <MaterialIcons name="check-circle" size={60} color={COLORS.success} />
            </View>
            <Text style={s.modalTitle}>Berhasil!</Text>
            <Text style={[s.modalMessage, { marginBottom: 15 }]}>{successMsg}</Text>
            
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      {/* Premium Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={[s.modalIconContainer, { backgroundColor: '#fff5f5' }]}>
              <MaterialIcons name="delete-outline" size={50} color={COLORS.danger} />
            </View>
            <Text style={s.modalTitle}>Hapus Foto?</Text>
            <Text style={s.modalMessage}>Apakah Anda yakin ingin menghapus foto profil ini? Tindakan ini tidak dapat dibatalkan.</Text>
            
            <View style={s.modalActions}>
              <TouchableOpacity 
                style={s.cancelBtn} 
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={s.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={s.confirmDestructiveBtn} 
                onPress={() => {
                  setShowConfirmModal(false);
                  deleteMutation.mutate();
                }}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.confirmDestructiveBtnText}>Ya, Hapus</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  container: { flex: 1, backgroundColor: '#fff' },
  headerWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: { padding: 10 },
  headerTitle: { fontSize: 18, ...FONT.bold, color: COLORS.text },
  scrollContent: { paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarLarge: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    backgroundColor: COLORS.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  avatarImage: { width: '110%', height: '110%' },
  avatarLargeText: { fontSize: 44, ...FONT.bold, color: COLORS.primary },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    ...SHADOW.sm,
    elevation: 4,
  },
  avatarNote: { fontSize: 12, color: COLORS.textLight, marginTop: 12 },
  deletePhotoBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12 },
  deletePhotoText: { fontSize: 13, color: COLORS.danger, ...FONT.medium },
  form: { padding: 24, gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { 
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    ...SHADOW.lg,
  },
  modalIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    ...FONT.bold,
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...FONT.semibold,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  confirmDestructiveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  confirmDestructiveBtnText: {
    ...FONT.semibold,
    fontSize: 16,
    color: '#fff',
  },
  saveBtn: { 
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOW.md,
  },
  saveBtnText: { color: '#000000', fontSize: 16, ...FONT.bold },
});
