// Screen Register - Mobile

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StyleSheet, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import { COLORS, RADIUS, FONT, SHADOW } from '../../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register }          = useAuth();

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Peringatan', 'Semua field wajib diisi.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Peringatan', 'Password minimal 6 karakter.');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Peringatan', 'Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      Alert.alert('Registrasi Gagal', err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image 
            source={require('../../../assets/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.appName}>Buat Akun</Text>
          <Text style={styles.tagline}>Gratis selamanya, tidak perlu kartu kredit</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.fields}>
            <Input label="Nama Lengkap"         placeholder="Nama kamu"        value={form.name}     onChangeText={set('name')}    autoCapitalize="words" />
            <Input label="Email"                placeholder="email@contoh.com" value={form.email}    onChangeText={set('email')}   keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password"             placeholder="Min. 6 karakter"  value={form.password} onChangeText={set('password')} secureTextEntry />
            <Input label="Konfirmasi Password"  placeholder="Ulangi password"  value={form.confirm}  onChangeText={set('confirm')}  secureTextEntry />
          </View>
          <Button title="Buat Akun" onPress={handleRegister} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Masuk di sini</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand:     { alignItems: 'center', marginBottom: 28 },
  logo:      { width: 72, height: 72, marginBottom: 12, ...SHADOW.md },
  appName:   { fontSize: 24, ...FONT.black, color: COLORS.text },
  tagline:   { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
  card:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 24, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.md },
  fields:    { gap: 14, marginBottom: 20 },
  footer:    { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText:{ fontSize: 14, color: COLORS.textMuted },
  link:      { fontSize: 14, color: COLORS.primary, ...FONT.semibold },
});
