import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Badge } from './ui';
import { COLORS, RADIUS, FONT } from '../utils/theme';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { formatDate, formatDateTime, isOverdue, isNearDeadline, getDeadlineColor } from '../utils/helpers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TaskCard({ task, onPress, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, readonly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const statusCfg   = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const overdue     = task.deadline && task.status !== 'SELESAI' && isOverdue(task.deadline);
  const nearDl      = task.deadline && task.status !== 'SELESAI' && isNearDeadline(task.deadline);
  const dlColor     = getDeadlineColor(task.deadline, task.status);

  // Sub-tugas progress
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter(st => st.isDone).length;
  const totalSub  = subtasks.length;
  const progress  = totalSub > 0 ? doneCount / totalSub : 0;
  const progressColor = progress >= 0.7 ? '#10b981' : progress > 0.3 ? '#f59e0b' : '#94a3b8';

  const isFinished = task.status === 'SELESAI';
  const nextStatus = task.status === 'BELUM_MULAI' ? 'SEDANG_DIKERJAKAN' : 'SELESAI';
  const nextLabel  = task.status === 'BELUM_MULAI' ? 'Mulai' : 'Selesai';
  const nextIcon   = 'chevron-right';

  const toggleExpand = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.7 },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setExpanded(!expanded);
  };

  const renderLeftActions = (progress, dragX) => {
    if (isFinished || readonly) return null;
    const scale = dragX.interpolate({ inputRange: [0, 80], outputRange: [0.5, 1], extrapolate: 'clamp' });
    return (
      <TouchableOpacity
        onPress={() => { swipeRef.current?.close(); onStatusChange(task.id, nextStatus); }}
        activeOpacity={0.8}
        style={styles.swipeLeft}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <MaterialIcons name={nextIcon} size={24} color="#fff" />
          <Text style={styles.swipeText}>{nextLabel}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderRightActions = (progress, dragX) => {
    if (readonly) return null;
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
    return (
      <TouchableOpacity
        onPress={() => { swipeRef.current?.close(); onDelete(task.id); }}
        activeOpacity={0.8}
        style={styles.swipeRight}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <MaterialIcons name="delete" size={24} color="#fff" />
          <Text style={styles.swipeText}>Hapus</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
    >
    <Card style={[styles.card, isFinished && styles.done]} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.dot, { backgroundColor: statusCfg.dot }]} />
          <Text
            numberOfLines={2}
            style={[styles.title, task.status === 'SELESAI' && styles.titleDone]}
          >
            {task.title}
          </Text>
        </View>

        {/* Action buttons (Top Right) */}
        {!readonly && (
          <View style={styles.actions}>
            {task.status !== 'SELESAI' && (
              <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionBtn} hitSlop={8}>
                <MaterialIcons name="edit" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.actionBtn} hitSlop={8}>
              <MaterialIcons name="delete" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Description */}
      {task.description ? (
        <Text numberOfLines={2} style={styles.desc}>{task.description}</Text>
      ) : null}

      {/* Badges & Subtask Toggle (Sejajar) */}
      <View style={styles.badgeRow}>
        <View style={styles.badges}>
          <Badge label={statusCfg.label}   bg={statusCfg.bg}   color={statusCfg.text} />
          <Badge label={priorityCfg.label} bg={priorityCfg.bg} color={priorityCfg.text} />
          {task.category && (
            <Badge
              label={task.category.name}
              bg={task.category.color + '22'}
              color={task.category.color}
            />
          )}
        </View>

        {totalSub > 0 && (
          <TouchableOpacity 
            onPress={toggleExpand} 
            style={[styles.subtaskPill, { borderColor: progressColor + '40', backgroundColor: progressColor + '10' }]} 
            activeOpacity={0.7}
          >
            <MaterialIcons name="format-list-bulleted" size={12} color={progressColor} />
            <Text style={[styles.subtaskPillText, { color: progressColor }]}>
              {doneCount}/{totalSub}
            </Text>
            <MaterialIcons 
              name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={14} 
              color={progressColor} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Sub-tugas progress bar */}
      {totalSub > 0 && (
        <View style={styles.subtaskContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: progressColor }]} />
          </View>
        </View>
      )}

      {/* Expandable Subtasks List */}
      {expanded && (
        <View style={styles.subtaskList}>
          {subtasks.map((st) => (
            <TouchableOpacity 
              key={st.id} 
              style={styles.subtaskItem} 
              onPress={() => !readonly && onSubtaskToggle(task.id, st.id)}
              activeOpacity={readonly ? 1 : 0.6}
            >
              <MaterialIcons 
                name={st.isDone ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color={st.isDone ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={[styles.subtaskTitle, st.isDone && styles.subtaskDone]}>
                {st.title}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Quick Input Row */}
          {!readonly && (
            <View style={styles.quickInputRow}>
              <TextInput
                style={styles.quickInput}
                placeholder="Tambah sub-tugas..."
                placeholderTextColor={COLORS.textLight}
                value={newSubtask}
                onChangeText={setNewSubtask}
                onSubmitEditing={() => {
                  if (newSubtask.trim()) {
                    onAddSubtask(task.id, newSubtask.trim());
                    setNewSubtask('');
                  }
                }}
              />
              {newSubtask.trim().length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    onAddSubtask(task.id, newSubtask.trim());
                    setNewSubtask('');
                  }}
                >
                  <MaterialIcons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Footer: deadline + quick action */}
      <View style={styles.footer}>
        {task.deadline ? (
          <Text style={[styles.deadline, { color: dlColor }]}>
            {overdue ? '⚠ ' : nearDl ? '⏰ ' : '📅 '}
            {overdue ? 'Terlambat · ' : ''}{formatDateTime(task.deadline)}
          </Text>
        ) : (
          <Text style={styles.noDeadline}>Tanpa deadline</Text>
        )}

        {task.status !== 'SELESAI' && !readonly && (
          <TouchableOpacity
            onPress={() => onStatusChange(task.id, task.status === 'BELUM_MULAI' ? 'SEDANG_DIKERJAKAN' : 'SELESAI')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionBadge}>
              <Text style={styles.quickActionText}>
                {task.status === 'BELUM_MULAI' ? 'Mulai' : 'Selesai'}
              </Text>
              <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Card>
    </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:        { marginBottom: 12 },
  done:        { opacity: 0.6 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  titleContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  title:       { flex: 1, fontSize: 16, lineHeight: 22, ...FONT.bold, color: COLORS.text },
  titleDone:   { textDecorationLine: 'line-through', color: COLORS.textLight, fontWeight: '400' },
  actions:     { flexDirection: 'row', gap: 6 },
  actionBtn:   { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: COLORS.bg },
  actionIcon:  { fontSize: 14, color: COLORS.textMuted },
  desc:        { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 10, marginLeft: 18 },
  badgeRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 18, marginBottom: 12, paddingRight: 12 },
  badges:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subtaskContainer: { marginLeft: 18, marginBottom: 12, paddingRight: 10 },
  progressBarBg:   { width: '100%', height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  subtaskPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10, 
    borderWidth: 1,
  },
  subtaskPillText: { fontSize: 11, ...FONT.bold },
  subtaskList:     { marginLeft: 18, marginBottom: 12, borderLeftWidth: 1.5, borderLeftColor: COLORS.border, paddingLeft: 12 },
  subtaskItem:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  subtaskTitle:    { fontSize: 13, color: COLORS.text, ...FONT.medium },
  subtaskDone:     { textDecorationLine: 'line-through', color: COLORS.textLight },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 18 },
  deadline:    { fontSize: 12, ...FONT.medium },
  noDeadline:  { fontSize: 12, color: COLORS.textLight },
  quickActionBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary + '15', // Light primary background
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: RADIUS.full,
    gap: 2
  },
  quickActionText: { fontSize: 12, color: COLORS.primary, ...FONT.bold },
  quickInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingRight: 8 },
  quickInput: { flex: 1, fontSize: 13, color: COLORS.text, paddingVertical: 4 },
  // Swipe Actions
  swipeLeft:   { backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: RADIUS.lg, marginBottom: 12, marginRight: 4 },
  swipeRight:  { backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: RADIUS.lg, marginBottom: 12, marginLeft: 4 },
  swipeText:   { color: '#fff', fontSize: 11, ...FONT.semibold, marginTop: 2 },
});
