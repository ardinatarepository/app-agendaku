import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Animated, 
  LayoutAnimation, Platform, UIManager, Modal, Pressable, Dimensions
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW } from '../utils/theme';
import { formatDateTime, isOverdue } from '../utils/helpers';
import { Input, ConfirmModal } from './ui';

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
      if (d > 0) str += `${d}d `;
      if (h > 0) str += `${h}h `;
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

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, onSubtaskDelete, readonly, isHighlighted }) => {
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 20 });
  const menuBtnRef = useRef(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [undoModalVisible, setUndoModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
 
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (isHighlighted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isHighlighted]);

  const openMenu = () => {
      menuBtnRef.current.measureInWindow((x, y, width, height) => {
        setMenuPos({ top: y + height, right: 40 });
        setMenuVisible(true);
      });
  };

  const isFinished = task.status === 'SELESAI';
  const isOverdueTask = task.status === 'TERLEWAT' || (!isFinished && isOverdue(task.deadline));
  const totalSub = task.subtasks?.length || 0;
  const doneSub = task.subtasks?.filter(st => st.isDone).length || 0;
  const overdue = !isFinished && isOverdue(task.deadline);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const priorityConfig = {
    TINGGI: { color: '#dc2626', symbol: 'T', bg: '#fee2e2' },
    NORMAL: { color: '#b45309', symbol: 'N', bg: '#fef3c7' },
    RENDAH: { color: '#475569', symbol: 'R', bg: '#f1f5f9' },
  }[task.priority || 'NORMAL'] || { color: '#475569', symbol: 'N', bg: '#f1f5f9' };

  const statusConfig = {
    SEDANG_DIKERJAKAN: { label: 'BERJALAN', color: '#0284C7', bg: '#E0F2FE' },
    SELESAI: { label: 'SELESAI', color: '#10B981', bg: '#ECFDF5' },
    TERLEWAT: { label: 'TERLEWAT', color: '#EF4444', bg: '#FEE2E2' },
  }[task.status] || { label: 'TUGAS', color: '#0284C7', bg: '#E0F2FE' };

  return (
    <>
    <Animated.View 
      style={{ 
        zIndex: menuVisible || isHighlighted ? 100 : 1, 
        opacity: fadeAnim, 
        transform: [
          { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          { scale: pulseAnim }
        ] 
      }}
    >
      <View 
        style={[
          styles.card, 
          isFinished && styles.cardFinished,
          isOverdueTask && styles.cardOverdue,
          isHighlighted && styles.cardHighlighted,
        ]}
      >
        {/* TOP ROW: Date & More Menu */}
        <View style={styles.topRow}>
          <View style={styles.dateWrap}>
            <Ionicons name="calendar-outline" size={14} color={overdue ? '#EF4444' : '#555555'} />
            <Text style={[styles.dateText, overdue && { color: '#EF4444' }]}>
              {formatDateTime(task.deadline) || 'Tanpa Deadline'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Tombol Undo khusus status Selesai */}
            {isFinished && (
              <TouchableOpacity 
                style={styles.undoBtnTop} 
                onPress={() => setUndoModalVisible(true)}
                activeOpacity={0.6}
              >
                <Ionicons name="arrow-undo" size={14} color={COLORS.danger} />
                <Text style={styles.undoTextTop}>Undo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity ref={menuBtnRef} onPress={openMenu} style={styles.moreBtn}>
              <MaterialCommunityIcons name="dots-vertical" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Action Menu Modal */}
          <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
              <View style={[styles.inlineMenu, { top: menuPos.top, right: menuPos.right }]}>
                {!(isFinished || isOverdueTask) && (
                  <>
                    <TouchableOpacity style={styles.inlineMenuItem} onPress={() => { setMenuVisible(false); onEdit(task); }}>
                      <MaterialIcons name="edit" size={16} color="#F59E0B" />
                      <Text style={styles.inlineMenuText}>Edit</Text>
                    </TouchableOpacity>
                    <View style={styles.inlineMenuDivider} />
                  </>
                )}
                <TouchableOpacity style={styles.inlineMenuItem} onPress={() => { setMenuVisible(false); onDelete(task.id); }}>
                  <MaterialIcons name="delete" size={16} color={COLORS.danger} />
                  <Text style={[styles.inlineMenuText, { color: COLORS.danger }]}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </View>

        {/* AREA KLIK UTAMA (Judul & Progres) */}
        <TouchableOpacity 
          onPress={toggleExpand}
          activeOpacity={0.7}
          style={{ paddingBottom: 4 }}
        >
          {/* MIDDLE ROW: Title */}
          <View style={styles.mainRow}>
            <View style={styles.titleContainer}>
              <Text 
                style={[
                  styles.titleText, 
                  (isFinished || isOverdueTask) && styles.titleDone
                ]} 
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </View>
          </View>

          {/* BADGES & PROGRESS ROW */}
          <View style={[styles.badgeContainer, { marginBottom: 8 }]}>
            <View style={[styles.badgeStatus, { backgroundColor: statusConfig?.bg || '#E0F2FE' }]}>
              <Text style={[styles.badgeStatusText, { color: statusConfig?.color || '#0284C7' }]}>
                {statusConfig?.label}
              </Text>
            </View>

            {/* Priority badge: uses dynamic bg & color from priorityConfig, same as web */}
            <View style={[styles.badgePriority, { backgroundColor: priorityConfig.bg }]}>
              <Text style={[styles.badgePriorityText, { color: priorityConfig.color }]}>{priorityConfig.symbol}</Text>
            </View>
            {task.category && (
              <View style={[styles.badgeCategory, { backgroundColor: task.category.color }]}>
                <Text style={styles.badgeCategoryText}>{task.category.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            {/* Progress & Chevron (Sejajar Horizontal & Tegas) */}
            <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {totalSub > 0 && (
                <>
                  <View style={styles.progressDot} />
                  <Text style={styles.progressText}>{doneSub}/{totalSub}</Text>
                </>
              )}
              
              {(totalSub > 0 || task.description) && (
                <MaterialCommunityIcons 
                  name={expanded ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#334155" 
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* EXPANDED CONTENT: Description & Subtasks */}
        {expanded && (
          <View style={styles.expandedContent}>
            {task.description ? (
              <Text style={styles.descriptionText}>{task.description}</Text>
            ) : null}
            
            {task.subtasks?.length > 0 && (
              <View style={styles.subtaskBox}>
                {task.subtasks.map(st => (
                  <View key={st.id} style={styles.subtaskRow}>
                    <TouchableOpacity 
                      style={styles.subtaskItem}
                      onPress={() => onSubtaskToggle(task.id, st.id, !st.isDone)}
                    >
                      <Ionicons 
                        name={st.isDone ? "checkmark-circle" : "ellipse-outline"} 
                        size={18} 
                        color={st.isDone ? COLORS.primary : "#D1D5DB"} 
                      />
                      <Text style={[styles.subtaskText, st.isDone && styles.subtaskTextDone]}>
                        {st.title}
                      </Text>
                    </TouchableOpacity>
                    
                    {!readonly && (
                      <TouchableOpacity 
                        onPress={() => onSubtaskDelete && onSubtaskDelete(task.id, st.id)}
                        hitSlop={8}
                        style={styles.subtaskDeleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* FOOTER ROW - More Compact */}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <Ionicons name="time-outline" size={13} color={COLORS.primary} />
            <CountdownTimer deadline={task.deadline} />
          </View>

          <View style={styles.footerRight}>
            {!(isFinished || isOverdueTask) && (
              <TouchableOpacity 
                style={styles.doneBtnAction} 
                onPress={() => onStatusChange(task.id, 'SELESAI')}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnActionText}>Selesai</Text>
                <Ionicons name="chevron-forward" size={14} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </View>
    </Animated.View>

    {/* Modal Konfirmasi Undo dipindahkan ke luar agar tidak terganggu animasi */}
    <ConfirmModal
      visible={undoModalVisible}
      title="Batalkan Selesai?"
      message="Apakah Anda yakin ingin mengembalikan tugas ini ke status 'Berjalan'?"
      confirmText="Ya"
      cancelText="Batal"
      variant="primary"
      iconName="undo"
      onConfirm={() => {
        setUndoModalVisible(false);
        onStatusChange(task.id, 'SEDANG_DIKERJAKAN');
      }}
      onCancel={() => setUndoModalVisible(false)}
    />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    opacity: 0.7,
  },
  cardHighlighted: {
    borderColor: '#FACC15',
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cardFinished: { opacity: 0.6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 10, color: '#94A3B8', ...FONT.medium, includeFontPadding: false, textAlignVertical: 'center' },
  moreBtn: { padding: 2 },
  mainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: { marginRight: 12 },
  titleContainer: { flex: 1 },
  titleText: { fontSize: 15, ...FONT.bold, color: '#000000' },
  titleDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Status badge: text-based like web (uppercase, small)
  badgeStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeStatusText: { fontSize: 9, ...FONT.bold, letterSpacing: 0.5 },
  // Priority badge: circle with letter, same as web
  badgePriority: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgePriorityText: { fontSize: 9, ...FONT.black },
  // Category badge: colored circle
  badgeCategory: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  badgeCategoryText: { fontSize: 9, ...FONT.black, color: '#fff' },
  expandedContent: { marginBottom: 12, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 14, marginTop: 4 },
  descriptionText: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 12, ...FONT.medium },
  subtaskBox: { gap: 8 },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 2 },
  subtaskItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtaskDeleteBtn: { padding: 4 },
  subtaskText: { fontSize: 13, color: '#334155', ...FONT.medium },
  subtaskTextDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  /* ── Footer: matches web black bar exactly ── */
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#000000',
    marginHorizontal: -12,
    marginBottom: -12,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdownText: { fontSize: 11, color: '#FACC15', ...FONT.black, letterSpacing: 0.5, includeFontPadding: false, textAlignVertical: 'center' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#334155' },
  progressText: { fontSize: 10, color: '#334155', ...FONT.bold },
  
  // Inline Menu & Overlay
  inlineMenu: { position: 'absolute', backgroundColor: '#fff', borderRadius: 12, width: 128, padding: 4, ...SHADOW.md, borderWidth: 1, borderColor: '#f1f5f9', zIndex: 1000 },
  inlineMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  inlineMenuText: { fontSize: 12, ...FONT.bold, color: COLORS.text },
  inlineMenuDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'transparent' },
  
  undoBtnTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  undoTextTop: { fontSize: 11, ...FONT.bold, color: COLORS.danger },
  
  /* Selesai button: matches web yellow rounded pill */
  doneBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  doneBtnActionText: {
    fontSize: 12,
    ...FONT.black,
    color: '#000',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default memo(TaskCard);
