// Screen Login - Mobile (Redesigned to match web version)

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, Image,
  TextInput, StatusBar,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { AlertModal } from '../../components/ui';
import { COLORS, RADIUS, FONT, SHADOW } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [form, setForm]           = useState({ email: '', password: '' });
  const [loading, setLoading]     = useState(false);
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', variant: 'danger' });
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setAlertInfo({ visible: true, title: 'Peringatan', message: 'Email dan password wajib diisi.', variant: 'danger' });
      return;
    }
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      // Navigation otomatis via AuthContext
    } catch (err) {
      let msg = 'Email atau password yang Anda masukkan salah. Silakan coba lagi.';
      if (!err.response) {
        msg = 'Server tidak dapat dijangkau. Pastikan koneksi internet kamu aktif.';
      } else if (err.response.data?.message) {
        msg = err.response.data.message;
      }
      setAlertInfo({ visible: true, title: 'Login Gagal', message: msg, variant: 'danger' });
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
            <Text style={styles.headlineMain}>Selamat</Text>
            <Text style={[styles.headlineMain, styles.headlineAccent]}>Datang!</Text>
            <Text style={styles.headlineSub}>Mulai kelola Agenda harianmu tanpa drama.</Text>
          </View>
        </View>

        {/* ── FORM PANEL ── */}
        <View style={styles.formPanel}>
          <Text style={styles.formTitle}>Masuk</Text>

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
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Masuk...' : 'Masuk'}
            </Text>
          </TouchableOpacity>

          {/* Switch Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Daftar Gratis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        variant={alertInfo.variant}
        onClose={() => setAlertInfo({ ...alertInfo, visible: false })}
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
    // Bold shadow ala web
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
