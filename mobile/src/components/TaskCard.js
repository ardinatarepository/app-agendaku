import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, Modal, TouchableWithoutFeedback, Dimensions, StatusBar } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Badge } from './ui';
import { COLORS, RADIUS, FONT, SHADOW } from '../utils/theme';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { formatDate, formatDateTime, isOverdue, isNearDeadline, getDeadlineColor } from '../utils/helpers';

// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

export default function TaskCard({ task, onPress, onEdit, onDelete, onStatusChange, onSubtaskToggle, onAddSubtask, readonly = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef(null);
  const moreBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const statusCfg   = STATUS_CONFIG[task.status] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
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
  const nextStatus = task.status === 'SELESAI' ? 'BELUM_MULAI' : 'SELESAI';
  const nextLabel  = task.status === 'SELESAI' ? 'Batal Selesai' : 'Selesai';
  const nextIcon   = task.status === 'SELESAI' ? 'chevron-left' : 'chevron-right';

  const toggleExpand = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.7 },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setExpanded(!expanded);
  };
  
  const toggleActions = () => {
    if (!showActions) {
      moreBtnRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Penyesuaian untuk Android StatusBar
        const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
        
        setMenuPos({ 
          top: pageY + 12 - statusBarHeight, // Naikkan agar lebih dekat ke icon titik 3
          right: Dimensions.get('window').width - (pageX + width) // Sejajarkan dengan pinggir kanan icon
        });
        setShowActions(true);
      });
    } else {
      setShowActions(false);
    }
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
      {/* Top Header: Deadline & More */}
      <View style={styles.topRow}>
        <View style={[styles.deadlinePill, { backgroundColor: COLORS.primary + '10' }]}>
          <MaterialIcons 
            name="schedule" 
            size={14} 
            color={COLORS.primary} 
          />
          <Text style={[styles.deadlineText, { color: COLORS.primary }]}>
            {overdue ? 'Terlewat: ' : ''}{formatDateTime(task.deadline)}
          </Text>
        </View>

        {!readonly && (
          <View style={styles.topActions}>
            <Modal
              visible={showActions}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowActions(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowActions(false)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.menuPopup, { top: menuPos.top, right: menuPos.right }]}>
                    <TouchableOpacity onPress={() => { setShowActions(false); onEdit(task); }} style={styles.menuItem}>
                      <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                      <Text style={styles.menuText}>Edit</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity onPress={() => { setShowActions(false); onDelete(task.id); }} style={styles.menuItem}>
                      <MaterialIcons name="delete" size={16} color={COLORS.danger} />
                      <Text style={[styles.menuText, { color: COLORS.danger }]}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            <TouchableOpacity 
              ref={moreBtnRef}
              onPress={toggleActions} 
              style={styles.moreBtn}
            >
              <MaterialIcons name="more-vert" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content: Title & Description */}
      <View style={styles.content}>
        <Text
          numberOfLines={2}
          style={[styles.title, isFinished && styles.titleDone]}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text numberOfLines={1} style={styles.desc}>{task.description}</Text>
        ) : null}
      </View>

      <View style={styles.divider} />

      {/* Stats/Badges Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: statusCfg.dot }]} />
          <Text style={styles.statText}>{statusCfg.label}</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: priorityCfg.text }]} />
          <Text style={styles.statText}>{priorityCfg.label}</Text>
        </View>

        {totalSub > 0 && (
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={toggleExpand}
            activeOpacity={0.7}
          >
            <View style={[styles.statDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.statText}>Sub: {doneCount}/{totalSub}</Text>
            <MaterialIcons 
              name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={14} 
              color={COLORS.textMuted} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Subtasks Expandable List */}
      {expanded && totalSub > 0 && (
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
                size={18} 
                color={st.isDone ? COLORS.primary : COLORS.textLight} 
              />
              <Text style={[styles.subtaskTitle, st.isDone && styles.subtaskDone]}>
                {st.title}
              </Text>
            </TouchableOpacity>
          ))}
          
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
                  <MaterialIcons name="add-circle" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Quick Action Toggle */}
      {!readonly && (
        <TouchableOpacity
          onPress={() => onStatusChange(task.id, nextStatus)}
          activeOpacity={0.7}
          style={styles.checkBtn}
        >
          <MaterialIcons 
            name={isFinished ? "check-circle" : "radio-button-unchecked"} 
            size={24} 
            color={isFinished ? COLORS.success : COLORS.textLight} 
          />
        </TouchableOpacity>
      )}
    </Card>
    </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:        { marginBottom: 12, padding: 16, borderRadius: RADIUS.xl, backgroundColor: COLORS.surface, ...SHADOW.sm, position: 'relative' },
  done:        { opacity: 0.5 },
  topRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  deadlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  deadlineText: { fontSize: 10, ...FONT.semibold },
  topActions:  { flexDirection: 'row' },
  moreBtn:     { padding: 4 },
  content:     { marginBottom: 14 },
  title:       { fontSize: 18, ...FONT.bold, color: COLORS.text, marginBottom: 4 },
  titleDone:   { textDecorationLine: 'line-through', color: COLORS.textLight },
  desc:        { fontSize: 12, color: COLORS.textLight, lineHeight: 16 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDot:     { width: 6, height: 6, borderRadius: 3 },
  statText:    { fontSize: 11, color: COLORS.textMuted, ...FONT.semibold },
  divider:     { height: 1, backgroundColor: COLORS.border, marginBottom: 12, opacity: 0.8 },
  subtaskList: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  subtaskItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  subtaskTitle: { fontSize: 13, color: COLORS.text, ...FONT.medium, flex: 1 },
  subtaskDone: { textDecorationLine: 'line-through', color: COLORS.textLight },
  quickInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  quickInput:  { flex: 1, fontSize: 12, color: COLORS.text, paddingVertical: 4 },
  checkBtn:    { position: 'absolute', right: 16, bottom: 10, padding: 4 },
  menuPopup:   { 
    position: 'absolute', 
    backgroundColor: '#fff', 
    borderRadius: RADIUS.md, 
    padding: 4, 
    minWidth: 120,
    zIndex: 999,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.lg
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuItem:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: RADIUS.sm },
  menuText:    { fontSize: 12, ...FONT.medium, color: COLORS.text },
  menuDivider: { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 4 },
  swipeLeft:   { backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: RADIUS.lg, marginBottom: 12, marginRight: 4 },
  swipeRight:  { backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: RADIUS.lg, marginBottom: 12, marginLeft: 4 },
  swipeText:   { color: '#fff', fontSize: 11, ...FONT.semibold, marginTop: 2 },
});
