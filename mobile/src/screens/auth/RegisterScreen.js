// Screen Register - Mobile (Redesigned to match web version)

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
  TextInput, StatusBar,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { AlertModal } from '../../components/ui';
import { COLORS, RADIUS, FONT, SHADOW } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]           = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', variant: 'danger', action: null });
  const [showPassword, setShowPassword] = useState(false);
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
      if (!err.response) {
        msg = 'Server tidak dapat dijangkau. Pastikan koneksi internet kamu aktif.';
      } else if (err.response.data?.message) {
        msg = err.response.data.message;
      }
      setAlertInfo({ visible: true, title: 'Registrasi Gagal', message: msg, variant: 'danger', action: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER / BRAND PANEL ── */}
        <View style={styles.headerPanel}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>A</Text>
            </View>
            <Text style={styles.logoText}>
              Agenda<Text style={styles.logoAccent}>Ku</Text>
            </Text>
          </View>

          {/* Headline */}
          <View style={styles.headline}>
            <Text style={styles.headlineMain}>Mulai</Text>
            <Text style={[styles.headlineMain, styles.headlineAccent]}>Sekarang!</Text>
            <Text style={styles.headlineSub}>Mulai kelola Agenda harianmu tanpa drama.</Text>
          </View>
        </View>

        {/* ── FORM PANEL ── */}
        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>Daftar</Text>

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
                style={[styles.input, { paddingRight: 48 }]}
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
                  color="#1A1A1A"
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
                style={[styles.input, { paddingRight: 48 }]}
                placeholder="Ulangi password"
                placeholderTextColor="#94A3B8"
                value={form.confirm}
                onChangeText={set('confirm')}
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
                  color="#1A1A1A"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Mendaftar...' : 'Daftar Akun'}
            </Text>
          </TouchableOpacity>

          {/* Switch Link */}
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
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scroll: {
    flexGrow: 1,
  },

  /* ── Header Panel (Dark) ── */
  headerPanel: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 70 : 56,
    paddingBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: '#FACC15',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 18,
    ...FONT.black,
    color: '#1A1A1A',
  },
  logoText: {
    fontSize: 20,
    ...FONT.black,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#FACC15',
  },
  headline: {
    marginBottom: 4,
  },
  headlineMain: {
    fontSize: 48,
    ...FONT.black,
    color: '#FFFFFF',
    lineHeight: 52,
    letterSpacing: -1,
  },
  headlineAccent: {
    color: '#FACC15',
  },
  headlineSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    ...FONT.semibold,
    marginTop: 12,
    lineHeight: 20,
  },

  /* ── Form Panel (White) ── */
  formPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
    minHeight: 400,
  },
  formTitle: {
    fontSize: 28,
    ...FONT.black,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.5,
  },

  /* ── Fields ── */
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    ...FONT.bold,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 54,
    backgroundColor: '#EFF1F4',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    ...FONT.semibold,
    color: '#1A1A1A',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },

  /* ── Strength ── */
  strengthWrap: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthLabel: {
    fontSize: 10,
    ...FONT.bold,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  strengthFill: {
    borderRadius: 99,
  },

  /* ── Submit Button ── */
  submitBtn: {
    height: 54,
    backgroundColor: '#FACC15',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    ...FONT.bold,
    color: '#1A1A1A',
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    ...FONT.bold,
    color: '#94A3B8',
  },
  footerLink: {
    fontSize: 13,
    ...FONT.bold,
    color: '#1A1A1A',
    textDecorationLine: 'underline',
  },
});
