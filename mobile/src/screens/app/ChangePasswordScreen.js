import { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, ScrollView, Modal, ActivityIndicator
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { authAPI } from '../../api';
import { COLORS, FONT, RADIUS, SHADOW } from '../../utils/theme';
import { Toast } from '../../components/ui';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigation]);

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Gagal mengubah password. Pastikan password saat ini benar.';
      setToast({ visible: true, message: msg, type: 'danger' });
    },
  });

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setToast({ visible: true, message: 'Semua kolom wajib diisi.', type: 'danger' });
    }
    if (newPassword.length < 6) {
      return setToast({ visible: true, message: 'Password baru minimal 6 karakter.', type: 'danger' });
    }
    if (newPassword !== confirmPassword) {
      return setToast({ visible: true, message: 'Konfirmasi password tidak cocok.', type: 'danger' });
    }
    if (newPassword === currentPassword) {
      return setToast({ visible: true, message: 'Password baru tidak boleh sama dengan password lama.', type: 'danger' });
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={s.headerWrapper}>
        <SafeAreaView>
          <View style={s.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={s.backBtn} 
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MaterialIcons name="arrow-back" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Ubah Password</Text>
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
          <View style={s.infoBox}>
            <MaterialIcons name="info-outline" size={20} color={COLORS.textMuted} />
            <Text style={s.infoText}>
              Gunakan minimal 6 karakter dengan kombinasi huruf dan angka untuk keamanan maksimal.
            </Text>
          </View>

          <View style={s.form}>
            {/* Current Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Password Saat Ini</Text>
              <View style={s.passwordWrapper}>
                <TextInput
                  style={s.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Masukkan password lama"
                  secureTextEntry={!showCurrentPassword}
                  placeholderTextColor={COLORS.textLight}
                />
                <TouchableOpacity 
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={s.eyeBtn}
                >
                  <MaterialIcons 
                    name={showCurrentPassword ? "visibility-off" : "visibility"} 
                    size={22} 
                    color={COLORS.textLight} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Password Baru</Text>
              <View style={s.passwordWrapper}>
                <TextInput
                  style={s.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Masukkan password baru"
                  secureTextEntry={!showNewPassword}
                  placeholderTextColor={COLORS.textLight}
                />
                <TouchableOpacity 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={s.eyeBtn}
                >
                  <MaterialIcons 
                    name={showNewPassword ? "visibility-off" : "visibility"} 
                    size={22} 
                    color={COLORS.textLight} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Konfirmasi Password Baru</Text>
              <View style={s.passwordWrapper}>
                <TextInput
                  style={s.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Ulangi password baru"
                  secureTextEntry={!showNewPassword}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[s.saveBtn, changePasswordMutation.isPending && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveBtnText}>Simpan Password Baru</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalIconContainer}>
              <MaterialIcons name="lock-outline" size={50} color={COLORS.success} />
            </View>
            <Text style={s.modalTitle}>Berhasil!</Text>
            <Text style={s.modalMessage}>Password Anda telah berhasil diperbarui. Silakan gunakan password baru untuk login berikutnya.</Text>
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    margin: 24,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 12
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  form: { paddingHorizontal: 24, gap: 24 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  passwordWrapper: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  passwordInput: { 
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeBtn: { padding: 12 },
  saveBtn: { 
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOW.md,
  },
  saveBtnText: { color: '#fff', fontSize: 16, ...FONT.bold },
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
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
