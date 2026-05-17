// Komponen UI Reusable - Mobile

import { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, TextInput, View, ActivityIndicator, StyleSheet, Modal, Animated, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { COLORS, RADIUS, SHADOW, FONT } from '../utils/theme';

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) => {
  const styles = {
    primary:   { bg: COLORS.primary,  text: '#000' },
    secondary: { bg: COLORS.surface,  text: COLORS.text,    border: COLORS.border },
    danger:    { bg: COLORS.danger,   text: '#fff' },
    ghost:     { bg: 'transparent',   text: COLORS.primary  },
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[{
        backgroundColor: styles.bg,
        borderRadius: RADIUS.md,
        paddingVertical: 13,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: styles.border ? 1 : 0,
        borderColor: styles.border || 'transparent',
        opacity: (disabled || loading) ? 0.55 : 1,
        ...SHADOW.sm,
      }, style]}
    >
      {loading
        ? <PremiumLoader size={20} color={styles.text} />
        : <Text style={{ color: styles.text, fontSize: 15, ...FONT.semibold, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' }}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = ({ label, error, multiline = false, style, containerStyle, rightElement, ...props }) => (
  <View style={[{ marginBottom: 4 }, containerStyle]}>
    {label && <Text style={{ fontSize: 13, ...FONT.bold, color: '#334155', marginBottom: 6 }}>{label}</Text>}
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: error ? COLORS.danger : '#94A3B8',
      borderRadius: RADIUS.md,
      height: multiline ? 96 : 48,
      paddingHorizontal: 14,
      ...style
    }}>
      <TextInput
        placeholderTextColor={COLORS.textLight}
        multiline={multiline}
        style={{
          flex: 1,
          height: '100%',
          fontSize: 15,
          color: COLORS.text,
          textAlignVertical: multiline ? 'top' : 'center',
          paddingVertical: multiline ? 12 : 0,
          ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
        }}
        {...props}
      />
      {rightElement}
    </View>
    {error && <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>}
  </View>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, style, onPress }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.92}
      style={[{
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.sm,
      }, style]}
    >
      {children}
    </Wrapper>
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────
export const Badge = ({ label, bg, color }) => (
  <View style={{ backgroundColor: bg, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color, fontSize: 11, ...FONT.medium, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' }}>{label}</Text>
  </View>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const Divider = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: COLORS.borderLight, marginVertical: 12 }, style]} />
);

// ─── Empty State ─────────────────────────────────────────────────────────────
export const EmptyState = ({ iconName = 'inbox', emoji, title, subtitle, action }) => (
  <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
    {emoji ? (
      <Text style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</Text>
    ) : (
      <MaterialIcons name={iconName} size={64} color={COLORS.textDisabled} style={{ marginBottom: 16 }} />
    )}
    <Text style={{ fontSize: 16, ...FONT.semibold, color: COLORS.text, textAlign: 'center' }}>{title}</Text>
    {subtitle && <Text style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>}
    {action}
  </View>
);

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = 'Hapus', cancelText = 'Batal', variant = 'danger', iconName, loading = false }) => (
  <Modal visible={visible} transparent animationType="fade">
     <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={[{ 
          backgroundColor: COLORS.surface, 
          borderRadius: RADIUS.lg, 
          width: '100%', 
          maxWidth: 320, 
          padding: 20, 
          ...SHADOW.md 
        }, Platform.OS === 'web' && { maxWidth: 400, alignSelf: 'center' }]}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: variant === 'danger' ? '#fee2e2' : COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
             <MaterialIcons name={iconName || (variant === 'danger' ? 'delete' : 'info')} size={32} color={variant === 'danger' ? COLORS.danger : COLORS.primary} />
          </View>
          <Text style={{ fontSize: 18, ...FONT.bold, color: COLORS.text, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 24 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
             <Button title={cancelText} variant="secondary" style={{ flex: 1, paddingVertical: 10 }} onPress={onCancel} disabled={loading} />
             <Button title={confirmText} variant={variant} style={{ flex: 1, paddingVertical: 10 }} onPress={onConfirm} loading={loading} />
          </View>
       </View>
    </View>
  </Modal>
);

// ─── AlertModal ─────────────────────────────────────────────────────────────
export const AlertModal = ({ visible, title, message, onClose, buttonText = 'OK', variant = 'danger', iconName }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
       <View style={[{ backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, width: '100%', padding: 24, ...SHADOW.md }, Platform.OS === 'web' && { maxWidth: 400, alignSelf: 'center' }]}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: variant === 'danger' ? '#fee2e2' : variant === 'success' ? '#d1fae5' : COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
             <MaterialIcons name={iconName || (variant === 'danger' ? 'error-outline' : variant === 'success' ? 'check-circle-outline' : 'info')} size={32} color={variant === 'danger' ? COLORS.danger : variant === 'success' ? '#10b981' : COLORS.primary} />
          </View>
          <Text style={{ fontSize: 18, ...FONT.bold, color: COLORS.text, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 24 }}>{message}</Text>
          <Button title={buttonText} variant={variant === 'success' ? 'primary' : variant} style={{ width: '100%' }} onPress={onClose} />
       </View>
    </View>
  </Modal>
);

// ─── Toast ─────────────────────────────────────────────────────────────
export const Toast = ({ visible, message, onHide, type = 'success' }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide Down
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 50,
        useNativeDriver: true,
        bounciness: 8
      }).start();

      const timer = setTimeout(() => {
        // Slide Up to hide
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true
        }).start(() => onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 16, 
      right: 16, 
      backgroundColor: type === 'success' ? '#10b981' : COLORS.danger, 
      borderRadius: RADIUS.lg, 
      padding: 16, 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 12, 
      ...SHADOW.md, 
      zIndex: 10000,
      transform: [{ translateY: slideAnim }]
    }}>
      <MaterialIcons name={type === 'success' ? 'check-circle' : 'error'} size={24} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 14, ...FONT.bold, flex: 1, includeFontPadding: false }}>{message}</Text>
    </Animated.View>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────
export const Skeleton = ({ width, height, borderRadius = RADIUS.md, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[{
        width,
        height,
        backgroundColor: '#e2e8f0',
        borderRadius,
        opacity,
      }, style]}
    />
  );
};

// ─── Premium Loader ─────────────────────────────────────────────────────────
export const PremiumLoader = ({ size = 40, color = COLORS.primary, style }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animasi Rotasi
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    
    // Animasi Pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );

    rotate.start();
    pulse.start();

    return () => {
      rotate.stop();
      pulse.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View style={{ transform: [{ rotate: spin }], opacity }}>
        <MaterialIcons name="loop" size={size} color={color} />
      </Animated.View>
    </View>
  );
};

export const TaskSkeleton = () => (
  <View style={{ 
    backgroundColor: '#FFFFFF', 
    borderRadius: RADIUS.lg, 
    padding: 16, 
    marginBottom: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  }}>
    <Skeleton width={4} height={40} borderRadius={2} />
    <View style={{ flex: 1, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="60%" height={16} borderRadius={4} />
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={80} height={12} borderRadius={4} />
        <Skeleton width={40} height={12} borderRadius={4} />
      </View>
    </View>
  </View>
);

export const CalendarTaskSkeleton = () => (
  <View style={{ flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, height: 72 }}>
    <Skeleton width={4} height="100%" borderRadius={0} />
    <View style={{ flex: 1, padding: 12 }}>
      <Skeleton width={160} height={14} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Skeleton width={50} height={18} borderRadius={9} />
        <Skeleton width={50} height={18} borderRadius={9} />
      </View>
    </View>
  </View>
);

export const CategorySkeleton = () => (
  <Card style={{ marginBottom: 8, padding: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Skeleton width={14} height={14} borderRadius={7} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width={100} height={14} style={{ marginBottom: 4 }} />
        <Skeleton width={60} height={10} />
      </View>
      <Skeleton width={36} height={36} borderRadius={10} style={{ marginLeft: 8 }} />
      <Skeleton width={36} height={36} borderRadius={10} style={{ marginLeft: 8 }} />
    </View>
  </Card>
);
