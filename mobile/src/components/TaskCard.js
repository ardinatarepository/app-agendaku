import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, Modal, Dimensions, StatusBar } from 'react-native';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, SHADOW } from '../utils/theme';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { formatDateTime, isOverdue } from '../utils/helpers';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TaskCard({ task, onPress, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, readonly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef(null);
  const moreBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
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

  /* ── Swipe Render Functions ── */
  const renderLeftActions = (progress, dragX) => {
    if (isFinished || readonly) return null;
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [-20, 0, 0],
    });
    return (
      <TouchableOpacity
        onPress={() => { swipeRef.current?.close(); onStatusChange(task.id, 'SELESAI'); }}
        style={[styles.swipeAction, { backgroundColor: '#10b981', marginLeft: 0 }]}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Feather name="check" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderRightActions = (progress, dragX) => {
    if (readonly) return null;
    const trans = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [0, 0, 20],
    });
    return (
      <TouchableOpacity
        onPress={() => { swipeRef.current?.close(); onDelete(task.id); }}
        style={[styles.swipeAction, { backgroundColor: '#ef4444', marginRight: 0 }]}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Feather name="trash-2" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <Swipeable
        ref={swipeRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        friction={2}
        overshootLeft={false}
        overshootRight={false}
      >
        <View style={[styles.card, isFinished && styles.cardFinished]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.dateLabel, overdue && { color: '#f87171' }]}>
              {overdue ? '⚠ ' : ''}{formatDateTime(task.deadline) || 'Tanpa Tenggat'}
            </Text>
            {!readonly && (
              <View ref={moreBtnRef} collapsable={false}>
                <TouchableOpacity onPress={openMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialIcons name="more-horiz" size={26} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Title Row */}
          <View style={styles.titleRow}>
            {!readonly && (
              <TouchableOpacity
                onPress={() => onStatusChange(task.id, isFinished ? 'SEDANG_DIKERJAKAN' : 'SELESAI')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isFinished ? 'checkmark-circle' : 'ellipse-outline'}
                  size={28}
                  color={isFinished ? COLORS.success : '#f8fafc'}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={onPress} 
              style={{ flex: 1 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.title, isFinished && styles.titleDone]} numberOfLines={2}>
                {task.title}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.categoryPill}>
              <View style={[styles.categoryDot, { backgroundColor: task.category?.color || COLORS.primary }]}>
                <Text style={styles.categoryInitial}>{task.category?.name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
              <Text style={styles.categoryName}>{task.category?.name || 'Umum'}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Text style={[styles.pillText, { color: '#60a5fa' }]}>{statusCfg.label}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: priorityCfg.text + '33' }]}>
              <Text style={[styles.pillText, { color: priorityCfg.text }]}>{priorityCfg.label}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <TouchableOpacity
                onPress={totalSub > 0 ? toggleExpand : undefined}
                style={styles.footerItem}
                activeOpacity={0.6}
              >
                <Feather name="layers" size={14} color={expanded ? '#60a5fa' : '#94a3b8'} />
                <Text style={[styles.footerText, expanded && { color: '#60a5fa' }]}>{totalSub} Sub-tugas</Text>
                {totalSub > 0 && (
                  <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={expanded ? '#60a5fa' : '#94a3b8'} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerItem}>
              <Feather name="clock" size={14} color={overdue ? '#f87171' : '#94a3b8'} />
              <Text style={[styles.footerText, { fontWeight: 'bold' }, overdue && { color: '#f87171' }]}>
                {getTimeRemaining() || '--'}
              </Text>
            </View>
          </View>

          {/* Subtasks */}
          {expanded && totalSub > 0 && (
            <View style={styles.subtaskList}>
              {subtasks.map(st => (
                <TouchableOpacity
                  key={st.id}
                  style={styles.subtaskRow}
                  onPress={() => !readonly && onSubtaskToggle(task.id, st.id)}
                >
                  <Ionicons
                    name={st.isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={st.isDone ? COLORS.success : COLORS.textMuted}
                  />
                  <Text style={[styles.subtaskText, st.isDone && styles.subtaskTextDone]}>{st.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Swipeable>

      {/* Action Menu */}
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setShowActions(false)}
        >
          <View style={[styles.menuCard, { top: menuPos.top, right: menuPos.right }]}>
            <TouchableOpacity 
              style={styles.menuRow} 
              onPress={() => { setShowActions(false); onEdit(task); }}
            >
              <Ionicons name="pencil-outline" size={18} color="#f8fafc" />
              <Text style={styles.menuLabel}>Edit Tugas</Text>
            </TouchableOpacity>
            <View style={styles.menuSep} />
            <TouchableOpacity 
              style={styles.menuRow} 
              onPress={() => { setShowActions(false); onDelete(task.id); }}
            >
              <Ionicons name="trash-outline" size={18} color="#f87171" />
              <Text style={[styles.menuLabel, { color: '#f87171' }]}>Hapus Tugas</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    ...SHADOW.md,
  },
  cardFinished: { opacity: 0.6 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  dateLabel: { fontSize: 11, color: '#94a3b8', ...FONT.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  title: { flex: 1, fontSize: 18, ...FONT.bold, color: '#f8fafc', lineHeight: 24 },
  titleDone: { textDecorationLine: 'line-through', color: '#475569' },
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 7,
  },
  categoryDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInitial: { fontSize: 11, color: '#fff', ...FONT.bold },
  categoryName: { fontSize: 13, color: '#e2e8f0', ...FONT.medium },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  pillText: { fontSize: 11, ...FONT.bold },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, color: '#94a3b8', ...FONT.medium },
  subtaskList: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  subtaskText: { fontSize: 13, color: '#94a3b8', ...FONT.medium },
  subtaskTextDone: { textDecorationLine: 'line-through', color: '#475569' },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 20,
    marginBottom: 12,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  menuCard: {
    position: 'absolute',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 6,
    minWidth: 170,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOW.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuLabel: { fontSize: 14, ...FONT.semibold, color: '#f8fafc' },
  menuSep: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 8 },
});
