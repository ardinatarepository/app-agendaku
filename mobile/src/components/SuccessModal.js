// SuccessModal - Simple & Professional
// Tampilan bersih untuk konfirmasi tugas

import { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW } from '../utils/theme';

export default function SuccessModal({ visible, title, subtitle, deadline, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      if (onClose) onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={s.overlay}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]} />
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.iconWrap}>
            <MaterialIcons name="check-circle" size={50} color={COLORS.success} />
          </View>
          
          <Text style={s.title}>{title}</Text>
          
          <View style={s.content}>
            <Text style={s.subtitle}>{subtitle}</Text>
            {deadline && (
              <Text style={s.deadline}>Deadline: {deadline}</Text>
            )}
          </View>

          <TouchableOpacity style={s.btn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={s.btnText}>TUTUP</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  card: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    ...SHADOW.md,
  },
  iconWrap: { marginBottom: 16 },
  title: { fontSize: 18, ...FONT.bold, color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  content: { marginBottom: 20, alignItems: 'center' },
  subtitle: { fontSize: 15, ...FONT.medium, color: COLORS.text, textAlign: 'center' },
  deadline: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: RADIUS.md,
  },
  btnText: { color: '#fff', fontSize: 13, ...FONT.bold, letterSpacing: 1 },
});
