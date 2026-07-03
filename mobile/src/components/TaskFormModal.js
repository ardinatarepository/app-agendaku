import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Modal, StyleSheet, Platform, Animated, PanResponder, Dimensions, Keyboard, StatusBar, Alert,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Toast } from './ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';
import { parseNaturalLanguage, cleanTitle, classifyWord } from '../utils/smartParser';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Sub-Components (PrioritySelector, CustomDatePicker, CustomTimePicker tetap sama) ────────────────

function PrioritySelector({ value, onChange }) {
  const PRIORITIES = ['RENDAH', 'NORMAL', 'TINGGI'];
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
      {PRIORITIES.map(p => {
        const cfg = PRIORITY_CONFIG[p];
        const isActive = value === p;
        return (
          <TouchableOpacity key={p} onPress={() => onChange(p)} style={[prioStyle.btn, isActive && { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[prioStyle.label, isActive && { color: cfg.text }]}>{cfg.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function CustomDatePicker({ visible, value, onSelect, onClose }) {
  const initialDate = value ? new Date(value) : new Date();
  const [curr, setCurr] = useState(initialDate);
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={dpStyle.overlay}>
        <View style={dpStyle.card}>
          <View style={dpStyle.header}>
            <TouchableOpacity onPress={() => setCurr(new Date(year, month - 1, 1))}><MaterialIcons name="chevron-left" size={28} color={COLORS.text} /></TouchableOpacity>
            <Text style={dpStyle.monthTitle}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => setCurr(new Date(year, month + 1, 1))}><MaterialIcons name="chevron-right" size={28} color={COLORS.text} /></TouchableOpacity>
          </View>
          <View style={dpStyle.grid}>
            {DAYS.map(d => <Text key={d} style={dpStyle.dayLabel}>{d}</Text>)}
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={dpStyle.cell} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <TouchableOpacity key={dateStr} style={dpStyle.cell} onPress={() => onSelect(dateStr)}>
                  <View style={[
                    dpStyle.circle, 
                    isSelected && dpStyle.circleSelected,
                    isToday && !isSelected && dpStyle.circleToday
                  ]}>
                    <Text style={[
                      dpStyle.dayNum, 
                      isSelected && dpStyle.dayNumSelected, 
                      isToday && !isSelected && dpStyle.dayNumToday
                    ]}>{day}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={dpStyle.footer}>
            <TouchableOpacity style={dpStyle.btn} onPress={onClose}><Text style={dpStyle.btnText}>Batal</Text></TouchableOpacity>
            <TouchableOpacity style={dpStyle.btn} onPress={() => onSelect('')}><Text style={[dpStyle.btnText, { color: COLORS.danger }]}>Hapus</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function CustomTimePicker({ visible, value, onSelect, onClose }) {
  const [tempTime, setTempTime] = useState(value || '12:00');
  const [hh, mm] = tempTime.split(':');
  
  const ITEM_HEIGHT = 44;
  const VISIBLE_ITEMS = 3;

  const hourScrollRef = useRef(null);
  const minScrollRef = useRef(null);

  // Sync scroll positions and initial state when the modal opens
  useEffect(() => {
    if (visible) {
      const initialTime = value || '12:00';
      setTempTime(initialTime);
      const [h, m] = initialTime.split(':');
      
      const hIdx = HOURS.indexOf(h);
      const mIdx = MINUTES.indexOf(m);
      
      // Delay slightly to ensure layout has completed
      const timer = setTimeout(() => {
        if (hourScrollRef.current && hIdx !== -1) {
          hourScrollRef.current.scrollTo({ y: hIdx * ITEM_HEIGHT, animated: false });
        }
        if (minScrollRef.current && mIdx !== -1) {
          minScrollRef.current.scrollTo({ y: mIdx * ITEM_HEIGHT, animated: false });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [visible, value]);

  const handleScroll = (type, event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (type === 'h') {
      const val = HOURS[Math.max(0, Math.min(index, HOURS.length - 1))] || '00';
      setTempTime(prev => {
        const parts = prev.split(':');
        const currentMin = parts[1] || '00';
        return `${val}:${currentMin}`;
      });
    } else {
      const val = MINUTES[Math.max(0, Math.min(index, MINUTES.length - 1))] || '00';
      setTempTime(prev => {
        const parts = prev.split(':');
        const currentHour = parts[0] || '12';
        return `${currentHour}:${val}`;
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={dpStyle.overlay}>
        <View style={[dpStyle.card, { padding: 24, width: '90%', maxWidth: 320 }]}>
          <Text style={[dpStyle.monthTitle, { textAlign: 'center', marginBottom: 24 }]}>Pilih Waktu</Text>
          
          <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, justifyContent: 'center' }}>
            {/* Fixed Background Indicator */}
            <View style={{ 
              position: 'absolute', 
              top: ITEM_HEIGHT, 
              left: 0, 
              right: 0, 
              height: ITEM_HEIGHT, 
              backgroundColor: COLORS.primary, 
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.1)'
            }} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Jam */}
              <View style={{ flex: 1, height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
                <ScrollView 
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => handleScroll('h', e)}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                  nestedScrollEnabled={true}
                >
                  {HOURS.map(h => {
                    const isActive = h === hh;
                    return (
                      <View key={h} style={dpStyle.pickerItem}>
                        <Text style={isActive ? dpStyle.pickerTextActive : dpStyle.pickerText}>
                          {h}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={{ fontSize: 24, ...FONT.bold, marginHorizontal: 15, color: '#000000' }}>:</Text>

              {/* Menit */}
              <View style={{ flex: 1, height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
                <ScrollView 
                  ref={minScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => handleScroll('m', e)}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                  nestedScrollEnabled={true}
                >
                  {MINUTES.map(m => {
                    const isActive = m === mm;
                    return (
                      <View key={m} style={dpStyle.pickerItem}>
                        <Text style={isActive ? dpStyle.pickerTextActive : dpStyle.pickerText}>
                          {m}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>

          <View style={[dpStyle.footer, { marginTop: 24 }]}>
            <TouchableOpacity style={dpStyle.btn} onPress={onClose}><Text style={dpStyle.btnText}>Batal</Text></TouchableOpacity>
            <TouchableOpacity style={dpStyle.btn} onPress={() => onSelect(tempTime)}><Text style={dpStyle.btnText}>Pilih</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const AnimatedWord = ({ word, targetColor }) => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [prevColor, setPrevColor] = useState(targetColor);
  const [currColor, setCurrColor] = useState(targetColor);

  useEffect(() => {
    if (currColor !== targetColor) {
      setPrevColor(currColor);
      setCurrColor(targetColor);
      colorAnim.setValue(0);
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [targetColor]);

  const interpolatedColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevColor, currColor],
  });

  return (
    <Animated.Text style={{ color: interpolatedColor }}>
      {word}{' '}
    </Animated.Text>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TaskFormModal({ visible, task, onClose, onSubmit, isLoading, categories, initialDate, headerHeight = 60 }) {
  const STATUSES = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];
  
  const [form, setForm] = useState({
    title: '', description: '', status: 'SEDANG_DIKERJAKAN',
    priority: 'NORMAL', deadline: '', time: '12:00', reminderHours: '0', categoryId: '',
    subtasks: [], isRecurring: false, recurrence: 'HARIAN'
  });
  
  const [newSubTask, setNewSubTask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'danger' });
  const [titleError, setTitleError] = useState('');
  const [titleFocused, setTitleFocused] = useState(false);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isMounted = useRef(false);

  useEffect(() => {
    if (visible) {
      if (task) {
        const d = task.deadline ? new Date(task.deadline) : null;
        setForm({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'SEDANG_DIKERJAKAN',
          priority: task.priority || 'NORMAL',
          deadline: d ? d.toISOString().split('T')[0] : '',
          time: d ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '12:00',
          reminderHours: task.reminderHours ? String(task.reminderHours) : '0',
          categoryId: task.categoryId ? String(task.categoryId) : '',
          subtasks: task.subtasks || [],
          isRecurring: task.isRecurring || false,
          recurrence: task.recurrence || 'HARIAN',
        });
      } else {
        setForm({ 
          title: '', description: '', status: 'SEDANG_DIKERJAKAN', 
          priority: 'NORMAL', deadline: initialDate || '', 
          time: '12:00', reminderHours: '0', categoryId: '', 
          subtasks: [], isRecurring: false, recurrence: 'HARIAN' 
        });
      }
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else if (isMounted.current) {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start();
    }
    isMounted.current = true;
  }, [visible, task, initialDate]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => { if (gesture.dy > 0) translateY.setValue(gesture.dy); },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 120 || gesture.vy > 0.5) closeSheet();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    }
  }), []);

  const closeSheet = () => {
    Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }).start(() => onClose());
  };

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = () => {
    if (!form.title.trim()) { 
      setTitleError('Judul tugas wajib diisi.');
      return; 
    }
    let finalDeadline = null;
    if (form.deadline) {
      const [y, m, d] = form.deadline.split('-').map(Number);
      const [hh, mm] = form.time.split(':').map(Number);
      const dateObj = new Date(y, m - 1, d, hh, mm, 0);
      finalDeadline = dateObj.toISOString();
    }
    // Auto-clean judul sebelum submit (hapus kata kunci jadwal)
    const result = parseNaturalLanguage(form.title, categories);
    const finalTitle = result ? cleanTitle(form.title, result.wordsToRemove) : form.title;
    let finalSubtasks = [...form.subtasks];
    if (result && result.subtasks && result.subtasks.length > 0) {
      result.subtasks.forEach(nst => {
        if (!finalSubtasks.some(pst => pst.title.toLowerCase() === nst.title.toLowerCase())) {
          finalSubtasks.push(nst);
        }
      });
    }
    onSubmit({ ...form, title: finalTitle, categoryId: form.categoryId ? parseInt(form.categoryId) : null, deadline: finalDeadline, subtasks: finalSubtasks });
  };

  const handleSmartInput = (text, shouldClean = false) => {
    const result = parseNaturalLanguage(text, categories);
    if (!result) return null;

    setForm(prev => ({
      ...prev,
      title: shouldClean ? cleanTitle(prev.title, result.wordsToRemove) : prev.title,
      smartDetected: shouldClean ? null : result.summary,
      deadline: result.deadline || prev.deadline,
      time: result.time || prev.time,
      priority: result.priority || prev.priority,
      status: result.status || prev.status,
      categoryId: result.categoryId || prev.categoryId,
      isRecurring: result.isRecurring ?? prev.isRecurring,
      recurrence: result.recurrence || prev.recurrence,
      reminderHours: result.reminderHours || prev.reminderHours,
      subtasks: result.subtasks ? [...prev.subtasks, ...result.subtasks.filter(nst => !prev.subtasks.some(pst => pst.title === nst.title))] : prev.subtasks,
    }));
    return result.summary;
  };

  const addSubtask = () => {
    if (!newSubTask.trim()) return;
    setForm(p => ({ ...p, subtasks: [...p.subtasks, { title: newSubTask, isDone: false }] }));
    setNewSubTask('');
  };

  const removeSubtask = (i) => {
    setForm(p => ({ ...p, subtasks: p.subtasks.filter((_, idx) => idx !== i) }));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeSheet}>
          <View style={mStyle.overlay} />
        </TouchableOpacity>

        <Animated.View 
          style={[
            mStyle.sheet, 
            { 
              top: headerHeight,
              bottom: 0,
              transform: [{ translateY }] 
            }
          ]}
          {...panResponder.panHandlers}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            style={{ flex: 1 }}
          >
            <View style={mStyle.dragArea}><View style={mStyle.handle} /></View>
            {/* ── Header ── */}
            <View style={mStyle.header}>
              <Text style={mStyle.headerTitle}>{task ? 'Edit Tugas' : 'Tambah Tugas'}</Text>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={mStyle.body} 
              keyboardShouldPersistTaps="handled" 
              showsVerticalScrollIndicator={false}
            >
              {/* Smart Suggestion Banner */}
              {form.smartDetected && (
                <View style={mStyle.smartBanner}>
                  <View style={mStyle.smartBannerLeft}>
                    <View style={mStyle.smartIconCircle}>
                      <Ionicons name="flash" size={13} color="#EAB308" />
                    </View>
                    <Text style={mStyle.smartBannerText} numberOfLines={2}>
                      Jadwal terdeteksi: <Text style={mStyle.smartBannerHighlight}>{form.smartDetected}</Text>
                    </Text>
                  </View>
                  <View style={mStyle.smartBannerRight}>
                    <TouchableOpacity 
                      style={mStyle.smartApplyBtn}
                      onPress={() => handleSmartInput(form.title, true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                      <Text style={mStyle.smartApplyText}>Terapkan</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={mStyle.smartDismissBtn}
                      onPress={() => setForm(p => ({ ...p, smartDetected: null }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── Nama Tugas ── */}
              <View style={mStyle.inputGroup}>
                <Text style={mStyle.label}>Nama Tugas</Text>
                <View style={mStyle.richInputContainer}>
                  <TextInput
                    style={mStyle.hiddenTextInput}
                    placeholder="Masukan nama tugas anda"
                    placeholderTextColor="#94A3B8"
                    value={form.title}
                    onChangeText={(v) => {
                      const result = parseNaturalLanguage(v, categories);
                      setForm(prev => ({
                        ...prev,
                        title: v,
                        smartDetected: result ? result.summary : null,
                        deadline: result?.deadline || prev.deadline,
                        time: result?.time || prev.time,
                        priority: result?.priority || prev.priority,
                        status: result?.status || prev.status,
                        categoryId: result?.categoryId || prev.categoryId,
                        isRecurring: result?.isRecurring ?? prev.isRecurring,
                        recurrence: result?.recurrence || prev.recurrence,
                        reminderHours: result?.reminderHours || prev.reminderHours,
                      }));
                      if (titleError) setTitleError('');
                    }}
                    multiline={true}
                    selectionColor={COLORS.primary}
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="off"
                    textContentType="none"
                    keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
                  />
                  <View style={mStyle.colorLayer} pointerEvents="none">
                    <Text style={mStyle.colorText}>
                      {form.title ? form.title.split(' ').map((word, i) => {
                        const type = classifyWord(word);
                        let color = COLORS.text;
                        if (type === 'date') color = '#D97706';
                        if (type === 'time') color = '#EA580C';
                        if (type === 'priority_high') color = '#DC2626';
                        if (type === 'priority_normal') color = '#F59E0B';
                        if (type === 'priority_low') color = '#64748B';
                        if (type === 'recurrence') color = '#3B82F6';
                        if (type === 'status') color = '#10B981';
                        if (type === 'reminder') color = '#8B5CF6';
                        return <AnimatedWord key={i} word={word} targetColor={color} />;
                      }) : null}
                    </Text>
                  </View>
                </View>
                {titleError ? <Text style={mStyle.errorText}>{titleError}</Text> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <Ionicons name="flash" size={12} color="#EAB308" />
                  <Text style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic' }}>
                    Smart Detect: Ketik "besok", "senin", atau "jam 2" untuk atur otomatis.
                  </Text>
                </View>
              </View>

              {/* ── Deskripsi ── */}
              <View style={mStyle.fieldGroup}>
                <Text style={mStyle.label}>Deskripsi (opsional)</Text>
                <TextInput
                  style={[mStyle.fieldInput, { height: 100, textAlignVertical: 'top', paddingTop: 14 }]}
                  placeholder="Deskripsi tugas..."
                  placeholderTextColor="#94A3B8"
                  value={form.description}
                  onChangeText={(v) => setForm(p => ({ ...p, description: v }))}
                  multiline
                />
              </View>

              {/* ── Status (hanya saat edit) ── */}
              {task && (
                <View style={mStyle.fieldGroup}>
                  <Text style={mStyle.label}>Status</Text>
                  <View style={mStyle.gridRow}>
                    {STATUSES.map(s => {
                      const cfg = STATUS_CONFIG[s] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
                      const active = form.status === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setForm(p => ({ ...p, status: s }))}
                          style={[
                            mStyle.gridBtn,
                            { borderRadius: 24 },
                            active && { backgroundColor: cfg.bg, borderColor: cfg.dot, borderWidth: 1.5 }
                          ]}
                        >
                          <Text style={[mStyle.gridBtnText, active && { color: cfg.text, ...FONT.bold }]}>
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── Prioritas ── */}
              <View style={mStyle.fieldGroup}>
                <Text style={mStyle.label}>Prioritas</Text>
                <View style={mStyle.gridRow}>
                  {[['RENDAH', 'Rendah', '#FFFFFF', '#64748B'], ['NORMAL', 'Normal', '#FFFFFF', '#F59E0B'], ['TINGGI', 'Tinggi', '#FFFFFF', '#EF4444']].map(([key, label, activeTextColor, activeBgColor]) => {
                    const active = form.priority === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setForm(p => ({ ...p, priority: key }))}
                        style={[
                          mStyle.gridBtn,
                          { borderRadius: 24, height: 44 },
                          active ? { backgroundColor: activeBgColor, borderColor: activeBgColor, borderWidth: 0 } : { backgroundColor: '#F8FAFC', borderColor: '#F8FAFC', borderWidth: 0 }
                        ]}
                      >
                        <Text style={[mStyle.gridBtnText, active ? { color: activeTextColor, ...FONT.bold } : { color: '#475569', ...FONT.medium }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Sub-Tugas ── */}
              <View style={mStyle.fieldGroup}>
                <Text style={mStyle.label}>Sub Tugas</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <TextInput
                    style={[mStyle.fieldInput, { flex: 1, height: 48, borderRadius: 24, paddingHorizontal: 20 }]}
                    placeholder="Masukan Sub Tugas"
                    placeholderTextColor="#94A3B8"
                    value={newSubTask}
                    onChangeText={setNewSubTask}
                    onSubmitEditing={addSubtask}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={mStyle.addSubBtnCircle} onPress={addSubtask}>
                    <MaterialIcons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {form.subtasks.map((st, i) => (
                  <View key={i} style={mStyle.subTaskItem}>
                    <TouchableOpacity
                      onPress={() => setForm(p => ({ ...p, subtasks: p.subtasks.map((s, idx) => idx === i ? { ...s, isDone: !s.isDone } : s) }))}
                      style={[mStyle.subtaskCheckbox, st.isDone && mStyle.subtaskCheckboxDone]}
                    >
                      {st.isDone && <Text style={{ fontSize: 10, ...FONT.black, color: '#1A1A1A' }}>✓</Text>}
                    </TouchableOpacity>
                    <Text style={[mStyle.subTaskText, st.isDone && mStyle.subTaskTextDone]}>{st.title}</Text>
                    <TouchableOpacity onPress={() => removeSubtask(i)} style={{ padding: 4 }}>
                      <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* ── Tanggal & Waktu ── */}
              <View style={mStyle.fieldGroup}>
                <Text style={mStyle.label}>Tanggal & Waktu</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[mStyle.datePickerBtnCircle, { flex: 1 }]} onPress={() => setShowDatePicker(true)}>
                    <Text style={[mStyle.datePickerText, !form.deadline && { color: '#94A3B8' }]}>{form.deadline || 'Tanggal & Waktu'}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#1A1A1A" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[mStyle.datePickerBtnCircle, { width: 120 }]}
                    onPress={() => {
                      if (!form.deadline) {
                        const n = new Date();
                        const dStr = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
                        setForm(p => ({ ...p, deadline: dStr }));
                      }
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={mStyle.datePickerText}>{form.time}</Text>
                    <Ionicons name="time-outline" size={18} color="#1A1A1A" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Kategori ── */}
              <View style={mStyle.fieldGroup}>
                <Text style={mStyle.label}>Kategori</Text>
                <View style={mStyle.chipWrap}>
                  <TouchableOpacity
                    onPress={() => setForm(p => ({ ...p, categoryId: '' }))}
                    style={[
                      mStyle.chipRect,
                      !form.categoryId ? { backgroundColor: '#0F172A', borderColor: '#0F172A' } : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                    ]}
                  >
                    <Text style={[mStyle.chipRectText, !form.categoryId ? { color: '#FFFFFF', ...FONT.bold } : { color: '#475569' }]}>Semua</Text>
                  </TouchableOpacity>
                  {categories.map(cat => {
                    const active = form.categoryId === String(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setForm(p => ({ ...p, categoryId: String(cat.id) }))}
                        style={[
                          mStyle.chipRect,
                          active ? { backgroundColor: '#FFFFFF', borderColor: cat.color, borderWidth: 1.5 } : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                        ]}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color, marginRight: 6 }} />
                        <Text style={[mStyle.chipRectText, active ? { color: cat.color, ...FONT.bold } : { color: '#94A3B8' }]}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Ingatkan Saya ── */}
              <View style={mStyle.fieldGroup}>
                <Text style={mStyle.label}>Ingatkan saya</Text>
                <View style={mStyle.chipWrap}>
                  {[['0', 'Tidak Ada'], ['1', '1 Jam'], ['2', '2 Jam'], ['5', '5 Jam'], ['12', '12 Jam']].map(([val, lbl]) => {
                    const active = form.reminderHours === val;
                    return (
                      <TouchableOpacity
                        key={val}
                        onPress={() => setForm(p => ({ ...p, reminderHours: val }))}
                        style={[
                          mStyle.chipRect,
                          active ? { backgroundColor: '#FACC15', borderColor: '#FACC15' } : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                        ]}
                      >
                        <Text style={[mStyle.chipRectText, active ? { color: '#000000', ...FONT.bold } : { color: '#94A3B8' }]}>
                          {lbl}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Tugas Berulang ── */}
              <View style={[mStyle.fieldGroup, { marginBottom: 4 }]}>
                <View style={mStyle.toggleRow}>
                  <View>
                    <Text style={[mStyle.label, { marginBottom: 2, marginTop: 0 }]}>Tugas Berulang</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Ulangi tugas ini secara otomatis</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setForm(p => ({ ...p, isRecurring: !p.isRecurring }))}
                    style={[mStyle.toggle, form.isRecurring && mStyle.toggleOn]}
                    activeOpacity={0.8}
                  >
                    <View style={[mStyle.toggleThumb, form.isRecurring && mStyle.toggleThumbOn]} />
                  </TouchableOpacity>
                </View>

                {form.isRecurring && (
                  <View style={[mStyle.chipWrap, { marginTop: 10 }]}>
                    {[['HARIAN', 'Harian'], ['MINGGUAN', 'Mingguan'], ['BULANAN', 'Bulanan']].map(([id, lbl]) => (
                      <TouchableOpacity
                        key={id}
                        onPress={() => setForm(p => ({ ...p, recurrence: id }))}
                        style={[
                          mStyle.chipRect,
                          form.recurrence === id ? { backgroundColor: '#FACC15', borderColor: '#FACC15' } : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
                        ]}
                      >
                        <Text style={[mStyle.chipRectText, form.recurrence === id ? { color: '#000000', ...FONT.bold } : { color: '#94A3B8' }]}>{lbl}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── Footer: Batal / Simpan ── */}
            <View style={mStyle.footer}>
              <TouchableOpacity onPress={closeSheet} style={mStyle.cancelFooterBtn}>
                <Text style={mStyle.cancelFooterText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                style={[mStyle.saveFooterBtn, isLoading && { opacity: 0.5 }]}
              >
                <Text style={mStyle.saveFooterText}>{isLoading ? '...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>

          <CustomDatePicker visible={showDatePicker} value={form.deadline} onClose={() => setShowDatePicker(false)} onSelect={(date) => { setForm(p => ({ ...p, deadline: date })); setShowDatePicker(false); }} />
          <CustomTimePicker visible={showTimePicker} value={form.time} onClose={() => setShowTimePicker(false)} onSelect={(time) => { setForm(p => ({ ...p, time })); setShowTimePicker(false); }} />
          
          <Toast 
            visible={toast.visible} 
            message={toast.message} 
            type={toast.type} 
            onHide={() => setToast({ ...toast, visible: false })} 
          />
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const mStyle = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  dragArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3 },

  /* ── Header ── */
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    ...FONT.black,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  /* ── Body ── */
  body: { padding: 20, paddingBottom: 20 },

  /* ── Field group ── */
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, ...FONT.bold, color: '#1A1A1A', marginBottom: 8, marginTop: 0 },
  fieldInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#1A1A1A',
  },

  /* ── Grid buttons (Prioritas / Status) ── */
  gridRow: { flexDirection: 'row', gap: 8 },
  gridBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 0,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBtnText: { fontSize: 13, ...FONT.medium, color: '#94A3B8' },

  /* ── Subtask ── */
  addSubBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  subTaskDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 10 },
  subTaskText: { flex: 1, fontSize: 13, ...FONT.medium, color: '#334155' },
  subTaskTextDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  subtaskCheckbox: {
    width: 24, height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskCheckboxDone: {
    backgroundColor: '#FACC15',
    borderColor: '#FACC15',
  },

  /* ── Date picker button circle ── */
  datePickerBtnCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 48,
  },
  datePickerText: { fontSize: 13, ...FONT.medium, color: '#1A1A1A' },

  /* ── Rect chips (Kategori, Reminder) ── */
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRect: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  chipRectText: {
    fontSize: 13,
    ...FONT.medium,
  },

  /* ── Toggle (Tugas Berulang) ── */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  toggle: {
    width: 50, height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: '#FACC15' },
  toggleThumb: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelFooterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  cancelFooterText: { fontSize: 14, ...FONT.bold, color: '#FFFFFF' },
  saveFooterBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FACC15',
  },
  saveFooterText: { fontSize: 14, ...FONT.bold, color: '#1A1A1A' },

  /* ── Smart Banner (retained) ── */
  inputGroup: { marginBottom: 4 },
  richInputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 26,
    minHeight: 52,
    justifyContent: 'center',
    position: 'relative',
  },
  colorLayer: {
    position: 'absolute',
    left: Platform.OS === 'ios' ? 20 : 20,
    right: Platform.OS === 'ios' ? 20 : 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingVertical: 14,
    zIndex: 3,
  },
  colorText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Poppins_400Regular',
  },
  hiddenTextInput: {
    fontSize: 14,
    color: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
    backgroundColor: 'transparent',
    fontFamily: 'Poppins_400Regular',
    textAlignVertical: 'center',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  smartBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EAB308',
  },
  smartBannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  smartIconCircle: {
    backgroundColor: '#FFFFFF', width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0,
  },
  smartBannerText: { fontSize: 12, ...FONT.medium, color: '#1E293B', flex: 1, lineHeight: 16 },
  smartBannerHighlight: { ...FONT.bold, color: '#0F172A' },
  smartBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smartApplyBtn: {
    backgroundColor: '#16A34A', flexDirection: 'row', alignItems: 'center',
    height: 32, paddingHorizontal: 10, borderRadius: 8, gap: 4,
  },
  smartApplyText: { fontSize: 11, ...FONT.bold, color: '#FFFFFF', includeFontPadding: false },
  smartDismissBtn: {
    backgroundColor: '#EF4444', width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});



const prioStyle = StyleSheet.create({
  btn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: RADIUS.md, 
    borderWidth: 1.5, 
    borderColor: '#CBD5E1', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  label: { 
    fontSize: 13, 
    ...FONT.semibold, 
    color: '#475569',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 18,
  },
});

const dpStyle = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 16, width: '100%', maxWidth: 340, ...SHADOW.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontSize: 16, ...FONT.bold, color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 11, ...FONT.semibold, color: COLORS.textMuted, marginBottom: 8 },
  cell: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  circleSelected: { backgroundColor: COLORS.primary, borderRadius: 17 },
  circleToday: { backgroundColor: COLORS.primary, borderRadius: 17 },
  dayNum: { fontSize: 14, color: COLORS.text, ...FONT.medium, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dayNumSelected: { color: '#000000', ...FONT.bold, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dayNumToday: { color: '#000000', ...FONT.bold, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  btn: { paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { fontSize: 14, ...FONT.semibold, color: '#000000' },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 18,
    ...FONT.bold,
    color: COLORS.textMuted,
    opacity: 0.4,
  },
  pickerTextActive: {
    fontSize: 24,
    ...FONT.bold,
    color: '#000000',
    opacity: 1,
  },
});
