// Screen Login - Mobile (Clean Design v2)

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
    } catch (err) {
      let msg = 'Email atau password yang Anda masukkan salah. Silakan coba lagi.';
      if (!err.response) msg = 'Server tidak dapat dijangkau. Pastikan koneksi internet kamu aktif.';
      else if (err.response.data?.message) msg = err.response.data.message;
      setAlertInfo({ visible: true, title: 'Login Gagal', message: msg, variant: 'danger' });
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
          <Text style={styles.title}>Masuk</Text>

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
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.submitText}>{loading ? 'Masuk...' : 'Masuk'}</Text>
          </TouchableOpacity>

          {/* Footer link */}
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
        onClose={() => setAlertInfo(a => ({ ...a, visible: false }))}
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
