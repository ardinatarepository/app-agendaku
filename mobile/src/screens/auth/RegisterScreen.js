// Screen Register - Mobile (Clean Design v2)

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
  TextInput, StatusBar,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { AlertModal } from '../../components/ui';
import { FONT } from '../../utils/theme';

const BG   = '#FFFFFF';
const INK  = '#1A1A1A';
const GOLD = '#FACC15';
const GRAY = '#EFF1F4';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]           = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', variant: 'danger', action: null });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const { register } = useAuth();

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const closeAlert = () => {
    if (alertInfo.action) alertInfo.action();
    setAlertInfo(prev => ({ ...prev, visible: false }));
  };

  /* ── Password strength ── */
  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6)  return { label: 'Lemah',  color: '#F87171', w: 0.33 };
    if (p.length < 10) return { label: 'Sedang', color: '#FBBF24', w: 0.66 };
    return               { label: 'Kuat',   color: '#34D399', w: 1 };
  })();

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      setAlertInfo({ visible: true, title: 'Peringatan', message: 'Semua field wajib diisi.', variant: 'danger', action: null });
      return;
    }
    if (form.password.length < 6) {
      setAlertInfo({ visible: true, title: 'Peringatan', message: 'Password minimal 6 karakter.', variant: 'danger', action: null });
      return;
    }
    if (form.password !== form.confirm) {
      setAlertInfo({ visible: true, title: 'Peringatan', message: 'Konfirmasi password tidak cocok.', variant: 'danger', action: null });
      return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      setAlertInfo({
        visible: true,
        title: 'Registrasi Berhasil',
        message: 'Akun berhasil dibuat! Silakan masuk.',
        variant: 'success',
        action: () => navigation.navigate('Login'),
      });
    } catch (err) {
      let msg = 'Registrasi gagal. Coba lagi.';
      if (!err.response) msg = 'Server tidak dapat dijangkau. Pastikan koneksi internet kamu aktif.';
      else if (err.response.data?.message) msg = err.response.data.message;
      setAlertInfo({ visible: true, title: 'Registrasi Gagal', message: msg, variant: 'danger', action: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── FORM CONTAINER ── */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Daftar</Text>

          {/* Nama Lengkap */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukan nama Anda"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={set('name')}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="nama@email.com"
              placeholderTextColor="#94A3B8"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Min. 8 karakter"
                placeholderTextColor="#94A3B8"
                value={form.password}
                onChangeText={set('password')}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={22}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength */}
            {strength && (
              <View style={styles.strengthWrap}>
                <Text style={styles.strengthLabel}>Kekuatan: {strength.label}</Text>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { flex: strength.w, backgroundColor: strength.color }]} />
                  <View style={{ flex: 1 - strength.w }} />
                </View>
              </View>
            )}
          </View>

          {/* Konfirmasi Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Konfirmasi Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Ulangi password"
                placeholderTextColor="#94A3B8"
                value={form.confirm}
                onChangeText={set('confirm')}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showConfirm ? 'visibility-off' : 'visibility'}
                  size={22}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? 'Mendaftar...' : 'Daftar Akun'}</Text>
          </TouchableOpacity>

          {/* Footer link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        variant={alertInfo.variant}
        onClose={closeAlert}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 40,
  },

  /* Form */
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    ...FONT.black,
    color: INK,
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: -0.5,
  },

  /* Fields */
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    ...FONT.bold,
    color: INK,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 52,
    backgroundColor: GRAY,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 14,
    ...FONT.regular,
    color: INK,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },

  /* Strength */
  strengthWrap: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  strengthLabel: {
    fontSize: 10,
    ...FONT.bold,
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 99,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  strengthFill: {
    borderRadius: 99,
  },

  /* Submit */
  submitBtn: {
    height: 54,
    backgroundColor: GOLD,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitText: {
    fontSize: 16,
    ...FONT.bold,
    color: INK,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    ...FONT.semibold,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 13,
    ...FONT.bold,
    color: INK,
    textDecorationLine: 'underline',
  },
});
