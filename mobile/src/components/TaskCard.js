import { useState, useRef, useEffect, memo } from 'react';
import { View, Text, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, Modal, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT, SHADOW } from '../utils/theme';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { formatDateTime, isOverdue } from '../utils/helpers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const updateTimer = () => {
      if (!deadline) { setTimeLeft('--'); return; }
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft('Waktu Habis'); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      let parts = [];
      if (d > 0) parts.push(`${d} Hari`);
      if (h > 0) parts.push(`${h} Jam`);
      if (m > 0) parts.push(`${m} Menit`);
      if (s >= 0) parts.push(`${s} Detik`);
      setTimeLeft(parts.join(' '));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  return <Text style={styles.countdownText}>{timeLeft}</Text>;
};

const TaskCard = ({ task, onPress, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, readonly = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moreBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const isFinished = task.status === 'SELESAI';
  const overdue    = task.deadline && !isFinished && isOverdue(task.deadline);
  const totalSub   = task.subtasks?.length || 0;

  const openMenu = () => {
    if (!moreBtnRef.current) return;
    moreBtnRef.current.measure((x, y, width, height, pageX, pageY) => {
      const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      
      // Failsafe: If measure fails, use a default position instead of doing nothing
      const finalTop = (pageY !== undefined) ? (pageY + height + 5 - statusBarH) : 150;
      const finalRight = (pageX !== undefined) ? (Dimensions.get('window').width - (pageX + width)) : 20;

      setMenuPos({
        top: finalTop,
        right: finalRight,
      });
      setShowActions(true);
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <View style={[styles.card, isFinished && styles.cardFinished]}>
        
        {/* Header - Strictly separate View to avoid touch conflicts */}
        <View style={styles.headerRow}>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons name="calendar" size={14} color="#94a3b8" />
            <Text style={[styles.dateLabel, overdue && { color: '#f87171' }]}>
              {formatDateTime(task.deadline) || 'Tanpa Tenggat'}
            </Text>
          </View>
          
          {!readonly && (
            <View ref={moreBtnRef} collapsable={false}>
              <TouchableOpacity onPress={openMenu} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <MaterialCommunityIcons name="dots-horizontal" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Title & Clickable Area */}
        <View style={styles.titleContainer}>
          {!readonly && (
            <TouchableOpacity
              onPress={() => onStatusChange(task.id, isFinished ? 'SEDANG_DIKERJAKAN' : 'SELESAI')}
              style={styles.checkbox}
            >
              <Ionicons
                name={isFinished ? 'checkmark-circle' : 'ellipse-outline'}
                size={30}
                color={isFinished ? '#10b981' : '#f8fafc'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onPress} style={{ flex: 1 }} activeOpacity={0.7}>
            <Text style={[styles.title, isFinished && styles.titleDone]} numberOfLines={2}>
              {task.title}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.initialCircle, { backgroundColor: task.category?.color || '#3b82f6' }]}>
            <Text style={styles.initialText}>{task.category?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={[styles.initialCircle, { backgroundColor: task.priority === 'TINGGI' ? '#ef4444' : task.priority === 'NORMAL' ? '#f59e0b' : '#94a3b8' }]}>
            <Text style={styles.initialText}>{task.priority?.[0]?.toUpperCase() || 'N'}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: isFinished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)' }]}>
            <Text style={[styles.statusText, { color: isFinished ? '#10b981' : '#60a5fa' }]}>
              {isFinished ? 'Selesai' : 'Berjalan'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <MaterialCommunityIcons name="timer" size={14} color={overdue ? '#f87171' : '#94a3b8'} />
            <CountdownTimer deadline={task.deadline} />
          </View>

          {totalSub > 0 && (
            <TouchableOpacity 
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded(!expanded);
              }}
              style={styles.subtaskTrigger}
            >
              <Text style={styles.subtaskCount}>{totalSub} Sub-tugas</Text>
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Subtasks */}
        {expanded && totalSub > 0 && (
          <View style={styles.subtaskList}>
            {task.subtasks.map(st => (
              <TouchableOpacity
                key={st.id}
                style={styles.subtaskItem}
                onPress={() => !readonly && onSubtaskToggle(task.id, st.id)}
              >
                <Ionicons
                  name={st.isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={st.isDone ? '#10b981' : '#94a3b8'}
                />
                <Text style={[styles.subtaskText, st.isDone && styles.subtaskTextDone]}>{st.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Action Menu */}
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowActions(false)}>
          <View style={[styles.menuContainer, { top: menuPos.top, right: menuPos.right }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowActions(false); onEdit(task); }}>
              <MaterialCommunityIcons name="pencil" size={18} color="#f8fafc" />
              <Text style={styles.menuText}>Edit Tugas</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowActions(false); onDelete(task.id); }}>
              <MaterialCommunityIcons name="trash-can" size={18} color="#f87171" />
              <Text style={[styles.menuText, { color: '#f87171' }]}>Hapus Tugas</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#0F172A', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', ...SHADOW.md },
  cardFinished: { opacity: 0.7 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateLabel: { fontSize: 11, color: '#94a3b8', ...FONT.semibold, textTransform: 'uppercase' },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  checkbox: { padding: 2 },
  title: { flex: 1, fontSize: 17, ...FONT.bold, color: '#f8fafc', lineHeight: 24 },
  titleDone: { textDecorationLine: 'line-through', color: '#475569' },
  badgesRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 20 },
  initialCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontSize: 11, color: '#fff', ...FONT.bold },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, ...FONT.bold, textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countdownText: { fontSize: 12, color: '#f8fafc', ...FONT.bold },
  subtaskTrigger: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subtaskCount: { fontSize: 12, color: '#94a3b8', ...FONT.medium },
  subtaskList: { marginTop: 12, paddingLeft: 10 },
  subtaskItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  subtaskText: { fontSize: 13, color: '#cbd5e1', ...FONT.medium },
  subtaskTextDone: { textDecorationLine: 'line-through', color: '#475569' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: { position: 'absolute', backgroundColor: '#1E293B', borderRadius: 16, padding: 4, minWidth: 160, ...SHADOW.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  menuText: { fontSize: 14, color: '#f8fafc', ...FONT.semibold },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 8 },
});

export default memo(TaskCard);
