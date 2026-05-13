// Screen Login - Mobile

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StyleSheet, Image,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, AlertModal } from '../../components/ui';
import { COLORS, RADIUS, FONT, SHADOW } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', variant: 'danger' });
  const [showPassword, setShowPassword] = useState(false);
  const { login }             = useAuth();

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
      console.error('Login error:', err);
      let msg = 'Periksa email dan password kamu.';
      if (!err.response) {
        msg = 'Server tidak dapat dijangkau. Pastikan IP di config.js sudah benar dan HP berada di jaringan yang sama.';
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.appName}>AgendaKu</Text>
          <Text style={styles.tagline}>Kelola tugas & jadwalmu dengan mudah</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk</Text>

          <View style={styles.fields}>
            <Input
              label="Email"
              placeholder="email@contoh.com"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Password"
              placeholder="Password kamu"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}>
                  <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color={COLORS.textLight} />
                </TouchableOpacity>
              }
            />
          </View>

          <Button title="Masuk" onPress={handleLogin} loading={loading} style={styles.btn} />
        </View>

        {/* Daftar link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Daftar sekarang</Text>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 40 },
  brand:     { alignItems: 'center', marginBottom: 32 },
  logo:      { width: 80, height: 80, marginBottom: 14, ...SHADOW.md },
  appName:   { fontSize: 26, ...FONT.black, color: COLORS.text },
  tagline:   { fontSize: 14, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  card:      {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: 24, borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOW.md,
  },
  cardTitle: { fontSize: 18, ...FONT.bold, color: COLORS.text, marginBottom: 20 },
  fields:    { gap: 14, marginBottom: 20 },
  btn:       { marginTop: 4 },
  footer:    { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText:{ fontSize: 14, color: COLORS.textMuted },
  link:      { fontSize: 14, color: COLORS.primary, ...FONT.semibold },
});
