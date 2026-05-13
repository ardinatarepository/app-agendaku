import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, Modal, Pressable, Dimensions, StatusBar } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, SHADOW } from '../utils/theme';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { formatDateTime, isOverdue } from '../utils/helpers';

// Penting untuk animasi dropdown di Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TaskCard({ task, onPress, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, readonly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moreBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const statusCfg   = STATUS_CONFIG[task.status] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['NORMAL'];
  const isFinished  = task.status === 'SELESAI';
  const overdue     = task.deadline && !isFinished && isOverdue(task.deadline);

  const subtasks  = task.subtasks || [];
  const doneCount = subtasks.filter(st => st.isDone).length;
  const totalSub  = subtasks.length;
  const progress  = totalSub > 0 ? Math.round((doneCount / totalSub) * 100) : 0;

  const getTimeRemaining = () => {
    if (!task.deadline) return null;
    const diff = new Date(task.deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Terlewat';
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Besok';
    return `${days}h`;
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  const openMenu = () => {
    moreBtnRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      setMenuPos({
        top: pageY + height + 4 - statusBarH,
        right: Dimensions.get('window').width - (pageX + width),
      });
      setShowActions(true);
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <View style={[styles.card, isFinished && styles.cardFinished]}>

        {/* ── Header: Tanggal + Titik 3 ── */}
        <View style={styles.headerRow}>
          <Text style={[styles.dateLabel, overdue && { color: '#f87171' }]}>
            {overdue ? '⚠ ' : ''}{formatDateTime(task.deadline) || 'Tanpa Tenggat'}
          </Text>

          {!readonly && (
            <Pressable 
              ref={moreBtnRef} 
              onPress={openMenu} 
              hitSlop={15} 
              style={({ pressed }) => [styles.menuTrigger, pressed && { opacity: 0.6 }]}
            >
              <MaterialIcons name="more-horiz" size={26} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* ── Judul + Checkbox ── */}
        <View style={styles.titleRow}>
          {!readonly && (
            <Pressable 
              onPress={() => onStatusChange(task.id, isFinished ? 'SEDANG_DIKERJAKAN' : 'SELESAI')}
              hitSlop={10}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Ionicons
                name={isFinished ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={isFinished ? '#10b981' : '#475569'}
              />
            </Pressable>
          )}
          <Pressable 
            onPress={onPress} 
            style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.8 }]}
          >
            <Text style={[styles.title, isFinished && styles.titleDone]} numberOfLines={2}>
              {task.title}
            </Text>
          </Pressable>
        </View>

        {/* ── Badges ── */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryPill}>
            <View style={[styles.categoryDot, { backgroundColor: task.category?.color || '#3b82f6' }]}>
              <Text style={styles.categoryInitial}>{task.category?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <Text style={styles.categoryName}>{task.category?.name || 'Umum'}</Text>
          </View>

          <View style={[styles.pill, { backgroundColor: statusCfg.dot + '22' }]}>
            <Text style={[styles.pillText, { color: statusCfg.dot }]}>{statusCfg.label}</Text>
          </View>

          <View style={[styles.pill, { backgroundColor: priorityCfg.text + '22' }]}>
            <Text style={[styles.pillText, { color: priorityCfg.text }]}>{priorityCfg.label}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Pressable
              onPress={totalSub > 0 ? toggleExpand : undefined}
              style={({ pressed }) => [styles.footerItem, pressed && totalSub > 0 && { opacity: 0.6 }]}
            >
              <Feather name="layers" size={14} color={expanded ? '#3b82f6' : '#64748b'} />
              <Text style={[styles.footerText, expanded && { color: '#3b82f6' }]}>{totalSub}</Text>
              {totalSub > 0 && (
                <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={expanded ? '#3b82f6' : '#64748b'} />
              )}
            </Pressable>

            <View style={styles.footerItem}>
              <Feather name="pie-chart" size={14} color="#64748b" />
              <Text style={styles.footerText}>{progress}%</Text>
            </View>

            <View style={styles.footerItem}>
              <Feather name="check-square" size={14} color="#64748b" />
              <Text style={styles.footerText}>{doneCount}</Text>
            </View>
          </View>

          <View style={styles.footerItem}>
            <Feather name="clock" size={14} color={overdue ? '#f87171' : '#64748b'} />
            <Text style={[styles.footerText, { ...FONT.bold }, overdue && { color: '#f87171' }]}>
              {getTimeRemaining() || '--'}
            </Text>
          </View>
        </View>

        {/* ── Dropdown Sub-tugas ── */}
        {expanded && totalSub > 0 && (
          <View style={styles.subtaskList}>
            {subtasks.map(st => (
              <Pressable
                key={st.id}
                style={({ pressed }) => [styles.subtaskRow, pressed && { opacity: 0.6 }]}
                onPress={() => !readonly && onSubtaskToggle(task.id, st.id)}
              >
                <Ionicons
                  name={st.isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={st.isDone ? '#10b981' : '#475569'}
                />
                <Text style={[styles.subtaskText, st.isDone && styles.subtaskTextDone]}>{st.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ── Menu Modal ── */}
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowActions(false)}>
          <View style={[styles.menuCard, { top: menuPos.top, right: menuPos.right }]}>
            <Pressable 
              style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: '#334155' }]} 
              onPress={() => { setShowActions(false); onEdit(task); }}
            >
              <Feather name="edit-2" size={16} color="#e2e8f0" />
              <Text style={styles.menuLabel}>Edit Tugas</Text>
            </Pressable>

            <View style={styles.menuSep} />

            <Pressable 
              style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: '#334155' }]} 
              onPress={() => { setShowActions(false); onDelete(task.id); }}
            >
              <Feather name="trash" size={16} color="#ef4444" />
              <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Hapus Tugas</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    ...SHADOW.md,
  },
  cardFinished: { opacity: 0.55 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateLabel: { fontSize: 13, color: '#94a3b8', ...FONT.medium },
  menuTrigger: { padding: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: { flex: 1, fontSize: 19, ...FONT.bold, color: '#f1f5f9', lineHeight: 26 },
  titleDone: { textDecorationLine: 'line-through', color: '#64748b' },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    gap: 7,
  },
  categoryDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInitial: { fontSize: 10, color: '#fff', ...FONT.bold },
  categoryName: { fontSize: 13, color: '#e2e8f0', ...FONT.medium },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  pillText: { fontSize: 11, ...FONT.bold },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  footerText: { fontSize: 13, color: '#64748b', ...FONT.medium },
  subtaskList: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  subtaskText: { fontSize: 13, color: '#94a3b8', ...FONT.medium },
  subtaskTextDone: { textDecorationLine: 'line-through', color: '#475569' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuCard: {
    position: 'absolute',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 6,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#334155',
    ...SHADOW.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  menuLabel: { fontSize: 14, ...FONT.semibold, color: '#e2e8f0' },
  menuSep: { height: 1, backgroundColor: '#334155', marginHorizontal: 8 },
});
