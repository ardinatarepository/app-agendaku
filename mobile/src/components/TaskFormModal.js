import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Modal, StyleSheet, Platform, Animated, PanResponder, Dimensions, Keyboard, StatusBar, Alert,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, Input, Toast } from './ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../utils/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Sub-Components (PrioritySelector, CustomDatePicker, CustomTimePicker tetap sama) ────────────────

function PrioritySelector({ value, onChange }) {
  const PRIORITIES = ['RENDAH', 'NORMAL', 'TINGGI'];
  const configs = {
    RENDAH: { label: 'Rendah', active: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' } },
    NORMAL: { label: 'Normal', active: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' } },
    TINGGI: { label: 'Tinggi', active: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' } },
  };
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
      {PRIORITIES.map(p => {
        const cfg = configs[p];
        const isActive = value === p;
        return (
          <TouchableOpacity key={p} onPress={() => onChange(p)} style={[prioStyle.btn, isActive && { backgroundColor: cfg.active.bg, borderColor: cfg.active.border }]}>
            <Text style={[prioStyle.label, isActive && { color: cfg.active.text }]}>{cfg.label}</Text>
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

function CustomTimePicker({ visible, value, onSelect, onClose }) {
  const [tempTime, setTempTime] = useState(value || '12:00');
  const [hh, mm] = tempTime.split(':');
  
  const ITEM_HEIGHT = 44;
  const VISIBLE_ITEMS = 3;
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleScroll = (type, event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (type === 'h') {
      const val = hours[index] || '00';
      setTempTime(`${val}:${mm}`);
    } else {
      const val = mins[index] || '00';
      setTempTime(`${hh}:${val}`);
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
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => handleScroll('h', e)}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                >
                  {hours.map(h => (
                    <View key={h} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ 
                        fontSize: h === hh ? 24 : 18, 
                        ...FONT.bold, 
                        color: h === hh ? '#000000' : COLORS.textMuted,
                        opacity: h === hh ? 1 : 0.4
                      }}>{h}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <Text style={{ fontSize: 24, ...FONT.bold, marginHorizontal: 15, color: '#000000' }}>:</Text>

              {/* Menit */}
              <View style={{ flex: 1, height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => handleScroll('m', e)}
                  contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                >
                  {mins.map(m => (
                    <View key={m} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ 
                        fontSize: m === mm ? 24 : 18, 
                        ...FONT.bold, 
                        color: m === mm ? '#000000' : COLORS.textMuted,
                        opacity: m === mm ? 1 : 0.4
                      }}>{m}</Text>
                    </View>
                  ))}
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
    onSubmit({ ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null, deadline: finalDeadline });
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
            <View style={mStyle.header}>
              <TouchableOpacity onPress={closeSheet} style={mStyle.cancelBtn}>
                <Text style={mStyle.cancel}>Batal</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity 
                onPress={handleSubmit} 
                disabled={isLoading} 
                style={[mStyle.saveBtn, isLoading && { opacity: 0.5 }]}
              >
                <Text style={mStyle.save}>Simpan</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={mStyle.body} 
              keyboardShouldPersistTaps="handled" 
              showsVerticalScrollIndicator={false}
            >
              <Input 
                label="Nama Tugas *" 
                placeholder="Masukan Nama Tugas" 
                value={form.title} 
                onChangeText={(v) => {
                  set('title')(v);
                  if (titleError) setTitleError('');
                }} 
                error={titleError}
              />
              <View style={{ height: 12 }} />
              <Input label="Deskripsi (opsional)" placeholder="Deskripsi Tugas (Opsional)" value={form.description} onChangeText={set('description')} multiline />
              
              <Text style={mStyle.label}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
                  const active = form.status === s;
                  return (
                    <TouchableOpacity key={s} onPress={() => set('status')(s)} style={[mStyle.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.dot }]}>
                      <Text style={[mStyle.chipText, active && { color: cfg.text }]}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={mStyle.label}>Prioritas</Text>
              <PrioritySelector value={form.priority} onChange={set('priority')} />

              <Text style={mStyle.label}>Sub-Tugas</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput style={[mStyle.input, { flex: 1, marginBottom: 0 }]} placeholder="Tambah sub-tugas..." value={newSubTask} onChangeText={setNewSubTask} />
                <TouchableOpacity style={[mStyle.addBtn, { backgroundColor: COLORS.primary }]} onPress={addSubtask}><MaterialIcons name="add" size={24} color="#fff" /></TouchableOpacity>
              </View>
              {form.subtasks.map((st, i) => (
                <View key={i} style={mStyle.subTaskItem}>
                  <View style={mStyle.subTaskDot} />
                  <Text style={mStyle.subTaskText}>{st.title}</Text>
                  <TouchableOpacity onPress={() => removeSubtask(i)}><MaterialIcons name="delete-outline" size={20} color={COLORS.danger} /></TouchableOpacity>
                </View>
              ))}

              <Text style={mStyle.label}>Deadline & Waktu</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <TouchableOpacity style={[mStyle.datePickerBtn, { flex: 1 }]} onPress={() => setShowDatePicker(true)}>
                  <Text style={[mStyle.datePickerText, !form.deadline && { color: COLORS.textLight }]}>{form.deadline || 'Pilih Tanggal'}</Text>
                  <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[mStyle.datePickerBtn, { flex: 1 }]} 
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
                  <MaterialIcons name="access-time" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <Text style={mStyle.label}>Ingatkan saya (Jam Sebelum Deadline)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {['0', '1', '2', '5', '12', '24'].map(h => {
                  const active = form.reminderHours === h;
                  return (
                    <TouchableOpacity key={h} onPress={() => set('reminderHours')(h)} style={[mStyle.chip, active && { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                      <Text style={[mStyle.chipText, active && { color: '#b45309', ...FONT.bold }]}>{h === '0' ? 'Tidak Ada' : `${h} Jam`}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[mStyle.label, { marginBottom: 0 }]}>Tugas Berulang</Text>
                <TouchableOpacity onPress={() => setForm(p => ({ ...p, isRecurring: !p.isRecurring }))}>
                  <MaterialIcons name={form.isRecurring ? "toggle-on" : "toggle-off"} size={40} color={form.isRecurring ? COLORS.success : COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {form.isRecurring && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {[{ id: 'HARIAN', label: 'Harian' }, { id: 'MINGGUAN', label: 'Mingguan' }, { id: 'BULANAN', label: 'Bulanan' }].map(r => (
                    <TouchableOpacity key={r.id} onPress={() => set('recurrence')(r.id)} style={[mStyle.chip, form.recurrence === r.id && { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }]}>
                      <Text style={[mStyle.chipText, form.recurrence === r.id && { color: COLORS.primary }]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}


              <Text style={mStyle.label}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {categories.map(cat => (
                  <TouchableOpacity key={cat.id} onPress={() => set('categoryId')(String(cat.id))} style={[mStyle.chip, form.categoryId === String(cat.id) && { backgroundColor: cat.color + '22', borderColor: cat.color }]}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color, marginRight: 6 }} />
                    <Text style={[mStyle.chipText, form.categoryId === String(cat.id) && { color: cat.color, ...FONT.bold }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
          </KeyboardAvoidingView>

          <CustomDatePicker visible={showDatePicker} value={form.deadline} onClose={() => setShowDatePicker(false)} onSelect={(date) => { setForm(p => ({ ...p, deadline: date })); setShowDatePicker(false); }} />
          <CustomTimePicker visible={showTimePicker} value={form.time} onClose={() => setShowTimePicker(false)} onSelect={(time) => { setForm(p => ({ ...p, time })); setShowTimePicker(false); }} />
          
          <Toast 
            visible={toast.visible} 
            message={toast.message} 
            type={toast.type} 
            onHide={() => setToast({ ...toast, visible: false })} 
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const mStyle = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: { position: 'absolute', left: 0, right: 0, backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...SHADOW.lg, overflow: 'hidden' },
  dragArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.surface },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.danger },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, ...SHADOW.sm },
  cancel: { fontSize: 14, color: COLORS.danger, ...FONT.bold },
  save: { fontSize: 14, color: '#000000', ...FONT.bold, textAlign: 'center' },
  body: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, marginTop: 12, marginBottom: 8 },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, height: 48 },
  datePickerText: { fontSize: 15, color: COLORS.text },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  chipText: { fontSize: 13, ...FONT.medium, color: COLORS.textMuted, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, height: 44, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.surface, marginBottom: 12 },
  addBtn: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  subTaskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: COLORS.surface, padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  subTaskDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 10 },
  subTaskText: { flex: 1, fontSize: 14, color: COLORS.text },
});

const prioStyle = StyleSheet.create({
  btn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.surface },
  label: { fontSize: 13, ...FONT.semibold, color: COLORS.textMuted },
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
});
