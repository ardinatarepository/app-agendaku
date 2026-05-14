import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, 
  LayoutAnimation, Platform, UIManager
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW } from '../utils/theme';
import { formatDateTime, isOverdue } from '../utils/helpers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      if (!deadline) return setTimeLeft('');
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) return setTimeLeft('Waktu Habis');

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let str = '';
      if (d > 0) str += `${d}h `;
      if (h > 0) str += `${h}j `;
      str += `${m}m`;
      setTimeLeft(str);
    };

    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!timeLeft) return null;
  return <Text style={styles.countdownText}>{timeLeft}</Text>;
};

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, readonly }) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const moreBtnRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const isFinished = task.status === 'SELESAI';
  const totalSub = task.subtasks?.length || 0;
  const doneSub = task.subtasks?.filter(st => st.isDone).length || 0;
  const overdue = !isFinished && isOverdue(task.deadline);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      if (!readonly && onEdit) onEdit(task);
    });
  };

  const openMenu = () => {
    if (readonly) return;
    Alert.alert(
      'Opsi Tugas',
      'Pilih tindakan untuk tugas ini',
      [
        { text: 'Edit', onPress: () => onEdit(task) },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(task.id) },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: scaleAnim }] }}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePress}
        style={[
          styles.card, 
          isFinished && styles.cardFinished, 
          overdue && styles.cardOverdue
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="calendar" size={14} color={overdue ? '#ef4444' : COLORS.textMuted} />
            <Text style={[styles.dateLabel, overdue && { color: '#ef4444' }]}>
              {formatDateTime(task.deadline) || 'Tanpa Tenggat'}
            </Text>
          </View>
          
          {!readonly && (
            <View style={styles.priorityDot}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: task.priority === 'TINGGI' ? '#ef4444' : task.priority === 'NORMAL' ? '#f59e0b' : '#94a3b8' }} />
            </View>
          )}
        </View>

        <View style={styles.titleContainer}>
          {!readonly && (
            <TouchableOpacity
              onPress={() => onStatusChange(task.id, isFinished ? 'SEDANG_DIKERJAKAN' : 'SELESAI')}
              style={styles.checkbox}
            >
              <Ionicons
                name={isFinished ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={isFinished ? COLORS.success : COLORS.border}
              />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, isFinished && styles.titleDone]} numberOfLines={2}>
              {task.title}
            </Text>
            {task.description ? (
              <Text style={styles.description} numberOfLines={1}>{task.description}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <MaterialCommunityIcons name="timer" size={14} color={overdue ? '#ef4444' : COLORS.textMuted} />
            <CountdownTimer deadline={task.deadline} />
          </View>

          {totalSub > 0 && (
            <View style={styles.subtaskBadge}>
              <Text style={styles.subtaskCount}>{doneSub}/{totalSub}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  cardFinished: {
    opacity: 0.7,
  },
  cardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    ...FONT.semibold,
    textTransform: 'uppercase',
  },
  priorityDot: {
    padding: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 12,
    marginTop: -2,
  },
  title: {
    fontSize: 16,
    ...FONT.bold,
    color: COLORS.text,
    lineHeight: 22,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  description: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    ...FONT.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 12,
    color: COLORS.text,
    ...FONT.bold,
  },
  subtaskBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subtaskCount: {
    fontSize: 11,
    color: COLORS.primary,
    ...FONT.bold,
  },
});

export default memo(TaskCard);
