import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Animated, LayoutAnimation, Platform, UIManager, Modal, TouchableWithoutFeedback, Dimensions, StatusBar } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { Card } from './ui';
import { COLORS, RADIUS, FONT, SHADOW } from '../utils/theme';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { formatDateTime, isOverdue } from '../utils/helpers';

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
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const statusCfg   = STATUS_CONFIG[task.status] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['NORMAL'];
  const isFinished  = task.status === 'SELESAI';
  const overdue     = task.deadline && !isFinished && isOverdue(task.deadline);
  
  // Sub-tugas progress
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter(st => st.isDone).length;
  const totalSub  = subtasks.length;
  const progress  = totalSub > 0 ? Math.round((doneCount / totalSub) * 100) : 0;

  // Calculate time remaining (simplified)
  const getTimeRemaining = () => {
    if (!task.deadline) return null;
    const diff = new Date(task.deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    return `${days}d`;
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  
  const toggleActions = () => {
    if (!showActions) {
      moreBtnRef.current.measure((x, y, width, height, pageX, pageY) => {
        const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
        setMenuPos({ 
          top: pageY + 12 - statusBarHeight,
          right: Dimensions.get('window').width - (pageX + width)
        });
        setShowActions(true);
      });
    } else {
      setShowActions(false);
    }
  };

  const renderLeftActions = () => {
    if (isFinished || readonly) return null;
    return (
      <TouchableOpacity
        onPress={() => { swipeRef.current?.close(); onStatusChange(task.id, 'SELESAI'); }}
        style={[styles.swipeAction, { backgroundColor: '#10b981' }]}
      >
        <Feather name="check" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => {
    if (readonly) return null;
    return (
      <TouchableOpacity
        onPress={() => { swipeRef.current?.close(); onDelete(task.id); }}
        style={[styles.swipeAction, { backgroundColor: '#ef4444' }]}
      >
        <Feather name="trash-2" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
      <Swipeable ref={swipeRef} renderLeftActions={renderLeftActions} renderRightActions={renderRightActions} friction={2}>
        <Card style={[styles.card, isFinished && styles.cardFinished]} onPress={onPress}>
          
          {/* Top Label: Date & Time Replacement for "Client: Stellar" */}
          <View style={styles.topLabelRow}>
            <Text style={[styles.topLabelText, overdue && { color: '#f87171' }]}>
              {formatDateTime(task.deadline) || 'Tanpa Tenggat'}
            </Text>
            {!readonly && (
              <TouchableOpacity ref={moreBtnRef} onPress={toggleActions} hitSlop={15}>
                <MaterialIcons name="more-horiz" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Main Title */}
          <Text style={[styles.title, isFinished && styles.titleFinished]} numberOfLines={2}>
            {task.title}
          </Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {/* User Avatar Placeholder style like Phoenix Baker */}
            <View style={styles.userBadge}>
              <View style={[styles.miniAvatar, { backgroundColor: task.category?.color || '#3b82f6' }]}>
                <Text style={styles.miniAvatarText}>{task.category?.name?.[0] || 'A'}</Text>
              </View>
              <Text style={styles.userName}>{task.category?.name || 'Umum'}</Text>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.dot + '20' }]}>
              <Text style={[styles.statusText, { color: statusCfg.dot }]}>{statusCfg.label}</Text>
            </View>

            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.text + '20' }]}>
              <Text style={[styles.priorityText, { color: priorityCfg.text }]}>{priorityCfg.label}</Text>
            </View>
          </View>

          {/* Footer Stats Row */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <TouchableOpacity 
                onPress={totalSub > 0 ? toggleExpand : null} 
                style={styles.statIconItem}
                activeOpacity={0.7}
              >
                <Feather name="layers" size={14} color={expanded ? '#3b82f6' : '#64748b'} />
                <Text style={[styles.statIconText, expanded && { color: '#3b82f6' }]}>{totalSub}</Text>
                {totalSub > 0 && (
                  <Feather 
                    name={expanded ? "chevron-up" : "chevron-down"} 
                    size={12} 
                    color={expanded ? '#3b82f6' : '#64748b'} 
                    style={{ marginLeft: -2 }}
                  />
                )}
              </TouchableOpacity>
              
              <View style={styles.statIconItem}>
                <Feather name="pie-chart" size={14} color="#64748b" />
                <Text style={styles.statIconText}>{progress}%</Text>
              </View>

              <View style={styles.statIconItem}>
                <Feather name="check-square" size={14} color="#64748b" />
                <Text style={styles.statIconText}>{doneCount}</Text>
              </View>
            </View>

            <View style={styles.footerRight}>
              <Feather name="clock" size={14} color={overdue ? '#f87171' : '#64748b'} />
              <Text style={[styles.timeRemaining, overdue && { color: '#f87171' }]}>
                {getTimeRemaining() || '--'}
              </Text>
            </View>
          </View>

          {/* Subtasks List (Optional Expand) */}
          {expanded && totalSub > 0 && (
            <View style={styles.subtaskList}>
              {subtasks.map((st) => (
                <TouchableOpacity key={st.id} style={styles.subtaskItem} onPress={() => !readonly && onSubtaskToggle(task.id, st.id)}>
                  <Ionicons name={st.isDone ? "checkmark-circle" : "ellipse-outline"} size={16} color={st.isDone ? '#10b981' : '#475569'} />
                  <Text style={[styles.subtaskTitle, st.isDone && styles.subtaskDone]}>{st.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Modal Actions */}
          <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
            <TouchableWithoutFeedback onPress={() => setShowActions(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.menuPopup, { top: menuPos.top, right: menuPos.right }]}>
                  <TouchableOpacity onPress={() => { setShowActions(false); onEdit(task); }} style={styles.menuItem}>
                    <Feather name="edit-2" size={16} color="#fff" />
                    <Text style={styles.menuText}>Edit Tugas</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity onPress={() => { setShowActions(false); onDelete(task.id); }} style={styles.menuItem}>
                    <Feather name="trash" size={16} color="#ef4444" />
                    <Text style={[styles.menuText, { color: '#ef4444' }]}>Hapus Tugas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </Card>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827', // Deep Slate / Dark Gray
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    ...SHADOW.md,
  },
  cardFinished: {
    opacity: 0.6,
  },
  topLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topLabelText: {
    fontSize: 13,
    color: '#94a3b8', // Slate 400
    ...FONT.medium,
  },
  title: {
    fontSize: 22,
    ...FONT.bold,
    color: '#f8fafc', // Slate 50
    lineHeight: 30,
    marginBottom: 18,
  },
  titleFinished: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 8,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    color: '#fff',
    ...FONT.bold,
  },
  userName: {
    fontSize: 13,
    color: '#e2e8f0',
    ...FONT.medium,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 12,
    ...FONT.bold,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  priorityText: {
    fontSize: 12,
    ...FONT.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  statIconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIconText: {
    fontSize: 13,
    color: '#64748b',
    ...FONT.medium,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeRemaining: {
    fontSize: 13,
    color: '#64748b',
    ...FONT.bold,
  },
  subtaskList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subtaskTitle: {
    fontSize: 13,
    color: '#94a3b8',
    ...FONT.medium,
  },
  subtaskDone: {
    textDecorationLine: 'line-through',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuPopup: {
    position: 'absolute',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    ...SHADOW.lg,
    borderWidth: 1,
    borderColor: '#374151',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
  },
  menuText: {
    fontSize: 15,
    ...FONT.bold,
    color: '#fff',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginHorizontal: 8,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 20,
    marginBottom: 16,
  },
});
