// TaskListScreen - Fixed
// Perbaikan: borderRadius string CSS tidak valid di RN, useState→useEffect untuk form init, remove Theme support

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dimensions, PanResponder, Keyboard } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Batas atas sheet sejajar dengan batas bawah header hitam (60 + 25 + teks ≈ 113)
const HEADER_HEIGHT = 113;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;
import {
  View, Text, FlatList, SectionList, TouchableOpacity, TextInput,
  ScrollView, RefreshControl, Alert, Modal, StyleSheet, Platform, StatusBar, LayoutAnimation,
  KeyboardAvoidingView
} from 'react-native';
import { Animated } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { taskAPI, categoryAPI, subtaskAPI } from '../../api';
import { scheduleTaskNotification, cancelTaskNotification } from '../../utils/notifications';
import TaskCard from '../../components/TaskCard';
import SuccessModal from '../../components/SuccessModal';
import { Button, Input, EmptyState, Card, ConfirmModal, Toast, TaskSkeleton } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/theme';
import { groupTasksByDate, formatDateTime } from '../../utils/helpers';

const STATUSES = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];
const PRIORITIES = ['RENDAH', 'NORMAL', 'TINGGI'];
const STATUS_LBL = { SEDANG_DIKERJAKAN: 'Sedang Berjalan', SELESAI: 'Selesai', TERLEWAT: 'Terlewat' };
const PRIORITY_LBL = { RENDAH: 'Rendah', NORMAL: 'Normal', TINGGI: 'Tinggi' };

const SORT_OPTIONS = [
  { key: 'createdAt-desc', label: 'Terbaru', icon: 'schedule', sort: 'createdAt', order: 'desc' },
  { key: 'deadline-asc', label: 'Deadline', icon: 'event', sort: 'deadline', order: 'asc' },
  { key: 'priority-desc', label: 'Prioritas', icon: 'priority-high', sort: 'priority', order: 'desc' },
  { key: 'title-asc', label: 'Judul A-Z', icon: 'sort-by-alpha', sort: 'title', order: 'asc' },
];

// ─── Tombol Prioritas ──────────────────────────────────────────────────────────
function PrioritySelector({ value, onChange }) {
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
          <TouchableOpacity
            key={p}
            onPress={() => onChange(p)}
            style={[prioStyle.btn, isActive && { backgroundColor: cfg.active.bg, borderColor: cfg.active.border }]}
          >
            <Text style={[prioStyle.label, isActive && { color: cfg.active.text }]}>{cfg.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Filter Bottom Sheet ───────────────────────────────────────────────────────
function FilterSheet({ visible, filters, sortKey, onSortChange, categories, onApply, onClose, onReset }) {
  const [local, setLocal] = useState(filters);
  const [localSort, setLocalSort] = useState(sortKey);
  const set = (k, v) => setLocal(f => ({ ...f, [k]: f[k] === v ? '' : v }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={fStyle.overlay} activeOpacity={1} onPress={onClose} />
        <View style={fStyle.sheet}>
          <View style={fStyle.handle} />
          <View style={fStyle.header}>
            <Text style={fStyle.title}>Filter & Urutkan</Text>
            <TouchableOpacity onPress={() => {
              setLocal({ status: '', priority: '', categoryId: '' });
              setLocalSort('createdAt-desc');
              if (onReset) onReset();
            }}>
              <Text style={fStyle.reset}>Reset Semua</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
            <Text style={fStyle.secLabel}>Urutkan Berdasarkan</Text>
            <View style={fStyle.chipRow}>
              {SORT_OPTIONS.map(opt => {
                const active = localSort === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setLocalSort(opt.key)}
                    style={[fStyle.chip, active && fStyle.chipActive]}
                  >
                    <MaterialIcons name={opt.icon} size={16} color={active ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[fStyle.chipText, active && fStyle.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyle.secLabel}>Status</Text>
            <View style={fStyle.chipRow}>
              {STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
                const active = local.status === s;
                return (
                  <TouchableOpacity key={s} onPress={() => set('status', s)}
                    style={[fStyle.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.dot, ...SHADOW.sm }]}>
                    {active && <MaterialIcons name="check-circle" size={16} color={cfg.text} />}
                    <Text style={[fStyle.chipText, active && { color: cfg.text, ...FONT.bold }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyle.secLabel}>Prioritas</Text>
            <View style={fStyle.chipRow}>
              {PRIORITIES.map(p => {
                const cfg = PRIORITY_CONFIG[p];
                const active = local.priority === p;
                return (
                  <TouchableOpacity key={p} onPress={() => set('priority', p)}
                    style={[fStyle.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.text + '80', ...SHADOW.sm }]}>
                    {active && <MaterialIcons name="check-circle" size={16} color={cfg.text} />}
                    <Text style={[fStyle.chipText, active && { color: cfg.text, ...FONT.bold }]}>{PRIORITY_LBL[p]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyle.secLabel}>Kategori</Text>
            <View style={fStyle.chipRow}>
              {categories.map(c => {
                const active = local.categoryId === String(c.id);
                return (
                  <TouchableOpacity key={c.id} onPress={() => set('categoryId', String(c.id))}
                    style={[fStyle.chip, active && fStyle.chipActive, active && { borderColor: c.color }]}>
                    <View style={[fStyle.catDot, { backgroundColor: c.color }]} />
                    <Text style={[fStyle.chipText, active && { color: c.color, ...FONT.bold }]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={fStyle.footer}>
            <Button title="Terapkan" onPress={() => { onApply(local); onSortChange(localSort); onClose(); }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Custom Date Picker ──────────────────────────────────────────────────────
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function CustomDatePicker({ visible, value, onSelect, onClose }) {
  const initialDate = value ? new Date(value) : new Date();
  const [curr, setCurr] = useState(initialDate);

  const year = curr.getFullYear();
  const month = curr.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (offset) => {
    setCurr(new Date(year, month + offset, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dpStyle.overlay}>
        <View style={dpStyle.card}>
          <View style={dpStyle.header}>
            <TouchableOpacity onPress={() => changeMonth(-1)}><MaterialIcons name="chevron-left" size={28} color={COLORS.text} /></TouchableOpacity>
            <Text style={dpStyle.monthTitle}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}><MaterialIcons name="chevron-right" size={28} color={COLORS.text} /></TouchableOpacity>
          </View>

          <View style={dpStyle.grid}>
            {DAYS.map(d => <Text key={d} style={dpStyle.dayLabel}>{d}</Text>)}
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={dpStyle.cell} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={dpStyle.cell}
                  onPress={() => onSelect(dateStr)}
                >
                  <View style={[dpStyle.circle, isSelected && dpStyle.circleSelected]}>
                    <Text style={[dpStyle.dayNum, isSelected && dpStyle.dayNumSelected, isToday && !isSelected && { color: COLORS.primary, ...FONT.bold }]}>
                      {day}
                    </Text>
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

const dpStyle = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 16, width: '100%', maxWidth: 340, ...SHADOW.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontSize: 16, ...FONT.bold, color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 11, ...FONT.semibold, color: COLORS.textMuted, marginBottom: 8 },
  cell: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  circleSelected: { backgroundColor: COLORS.primary },
  dayNum: { fontSize: 14, color: COLORS.text, ...FONT.medium },
  dayNumSelected: { color: '#fff', ...FONT.bold },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  btn: { paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { fontSize: 14, ...FONT.semibold, color: COLORS.primary },
});

// ─── Custom Time Picker ──────────────────────────────────────────────────────
function CustomTimePicker({ visible, value, onSelect, onClose }) {
  const [tempTime, setTempTime] = useState(value || '12:00');
  const [hh, mm] = tempTime.split(':');

  const hourScrollRef = useRef(null);
  const minScrollRef = useRef(null);

  const hourScrollY = useRef(new Animated.Value(0)).current;
  const minScrollY = useRef(new Animated.Value(0)).current;

  const ITEM_HEIGHT = 44;
  const CONTAINER_HEIGHT = 220;
  const PADDING = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

  useEffect(() => {
    if (visible) {
      setTempTime(value || '12:00');
      // Reset animations
      const [h, m] = (value || '12:00').split(':');
      hourScrollY.setValue(parseInt(h, 10) * ITEM_HEIGHT);
      minScrollY.setValue(parseInt(m, 10) * ITEM_HEIGHT);

      setTimeout(() => {
        if (hourScrollRef.current?.scrollTo) hourScrollRef.current.scrollTo({ y: parseInt(h, 10) * ITEM_HEIGHT, animated: false });
        if (hourScrollRef.current?.getNode) hourScrollRef.current.getNode().scrollTo({ y: parseInt(h, 10) * ITEM_HEIGHT, animated: false });

        if (minScrollRef.current?.scrollTo) minScrollRef.current.scrollTo({ y: parseInt(m, 10) * ITEM_HEIGHT, animated: false });
        if (minScrollRef.current?.getNode) minScrollRef.current.getNode().scrollTo({ y: parseInt(m, 10) * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [visible, value]);

  const handleScroll = (type, e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    if (type === 'hour') {
      const newH = String(Math.max(0, Math.min(23, index))).padStart(2, '0');
      if (newH !== hh) setTempTime(`${newH}:${mm}`);
    } else {
      const newM = String(Math.max(0, Math.min(59, index))).padStart(2, '0');
      if (newM !== mm) setTempTime(`${hh}:${newM}`);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const renderItem = (item, index, scrollY, isHour) => {
    const inputRange = [(index - 2) * ITEM_HEIGHT, (index - 1) * ITEM_HEIGHT, index * ITEM_HEIGHT, (index + 1) * ITEM_HEIGHT, (index + 2) * ITEM_HEIGHT];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.6, 0.8, 1.25, 0.8, 0.6],
      extrapolate: 'clamp'
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.2, 0.5, 1, 0.5, 0.2],
      extrapolate: 'clamp'
    });

    return (
      <TouchableOpacity
        key={item}
        onPress={() => {
          const scrollRef = isHour ? hourScrollRef.current : minScrollRef.current;
          const node = scrollRef?.getNode ? scrollRef.getNode() : scrollRef;
          node?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
        }}
        style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
      >
        <Animated.Text style={[tpStyle.itemText, { transform: [{ scale }], opacity }]}>
          {item}
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dpStyle.overlay}>
        <View style={[dpStyle.card, { maxHeight: 400 }]}>
          <Text style={[dpStyle.monthTitle, { marginBottom: 16, textAlign: 'center' }]}>Pilih Jam</Text>

          <View style={{ flexDirection: 'row', height: CONTAINER_HEIGHT, marginTop: 10, position: 'relative' }}>
            {/* Highlight box */}
            <View style={{ position: 'absolute', top: PADDING, left: 10, right: 10, height: ITEM_HEIGHT, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, zIndex: -1 }} />

            <Animated.ScrollView
              ref={hourScrollRef}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: PADDING }}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: hourScrollY } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={(e) => handleScroll('hour', e)}
              scrollEventThrottle={16}
            >
              {hours.map((h, i) => renderItem(h, i, hourScrollY, true))}
            </Animated.ScrollView>

            <View style={tpStyle.separatorWrap}>
              <Text style={tpStyle.separatorText}>:</Text>
            </View>

            <Animated.ScrollView
              ref={minScrollRef}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: PADDING }}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: minScrollY } } }],
                { useNativeDriver: true }
              )}
              onMomentumScrollEnd={(e) => handleScroll('minute', e)}
              scrollEventThrottle={16}
            >
              {mins.map((m, i) => renderItem(m, i, minScrollY, false))}
            </Animated.ScrollView>
          </View>

          <View style={dpStyle.footer}>
            <TouchableOpacity style={dpStyle.btn} onPress={onClose}>
              <Text style={[dpStyle.btnText, { color: COLORS.textMuted }]}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dpStyle.btn} onPress={() => onSelect(tempTime)}>
              <Text style={dpStyle.btnText}>Pilih</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const tpStyle = StyleSheet.create({
  itemText: { fontSize: 20, color: COLORS.text, ...FONT.bold },
  separatorWrap: { width: 30, alignItems: 'center', justifyContent: 'center' },
  separatorText: { fontSize: 24, ...FONT.bold, color: COLORS.text, marginTop: -4 },
});

function TaskFormModal({ visible, task, onClose, onSubmit, isLoading, categories, initialDate }) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'SEDANG_DIKERJAKAN',
    priority: 'NORMAL', deadline: '', time: '12:00', reminderHours: '0', categoryId: '',
    subtasks: [], isRecurring: false, recurrence: 'DAILY'
  });
  const [newSubTask, setNewSubTask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Animated value untuk slide bottom sheet
  const translateY = useRef(new Animated.Value(SHEET_MAX_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Slide naik
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      // Slide turun (reset posisi)
      translateY.setValue(SHEET_MAX_HEIGHT);
    }
  }, [visible]);

  // PanResponder untuk swipe ke bawah
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 0.5) {
          // Swipe cukup jauh → tutup
          Animated.timing(translateY, {
            toValue: SHEET_MAX_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          // Kembalikan ke atas
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

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
      setTitleError('');
    }
  }, [task, visible, initialDate]);

  const set = (f) => (v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setTitleError('Judul tugas tidak boleh kosong.');
      return;
    }
    setTitleError('');

    let finalDeadline = null;
    if (form.deadline) {
      const [y, m, d] = form.deadline.split('-').map(Number);
      const [hh, mm] = form.time.split(':').map(Number);
      const dateObj = new Date(y, m - 1, d, hh, mm, 0);
      finalDeadline = dateObj.toISOString();
    }

    onSubmit({
      ...form,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      deadline: finalDeadline,
      isRecurring: form.isRecurring,
      recurrence: form.isRecurring ? form.recurrence : null
    });
  };

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SHEET_MAX_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Bottom Sheet */}
      <Animated.View style={[mStyle.sheet, { height: SHEET_MAX_HEIGHT - kbHeight, transform: [{ translateY }] }]}>

        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={mStyle.dragArea}>
          <View style={mStyle.handle} />
        </View>

        {/* Header */}
        <View style={mStyle.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Text style={mStyle.cancel}>Batal</Text>
          </TouchableOpacity>
          <Text style={mStyle.title}>{task ? 'Edit Tugas' : 'Tambah Tugas'}</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isLoading} hitSlop={12}>
            <Text style={[mStyle.save, isLoading && { opacity: 0.5 }]}>
              {isLoading ? 'Simpan...' : 'Simpan'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={mStyle.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <Input
            label="Nama Tugas *"
            placeholder="Masukan Nama Tugas"
            value={form.title}
            onChangeText={(v) => { set('title')(v); if (v.trim()) setTitleError(''); }}
            style={titleError ? { borderColor: COLORS.danger, borderWidth: 1.5 } : {}}
          />
          {titleError ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 12 }}>
              <MaterialIcons name="error-outline" size={14} color={COLORS.danger} />
              <Text style={{ fontSize: 12, color: COLORS.danger }}>{titleError}</Text>
            </View>
          ) : null}
          <View style={{ height: 12 }} />
          <Input label="Deskripsi (opsional)" placeholder="Deskripsi Tugas (Opsional)" value={form.description} onChangeText={set('description')} multiline />
          <View style={{ height: 12 }} />

          <Text style={mStyle.label}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
              const active = form.status === s;
              return (
                <TouchableOpacity key={s} onPress={() => set('status')(s)}
                  style={[mStyle.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.dot }]}>
                  <Text style={[mStyle.chipText, active && { color: cfg.text }]}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={mStyle.label}>Prioritas</Text>
          <PrioritySelector value={form.priority} onChange={set('priority')} />

          <Text style={mStyle.label}>Deadline & Waktu</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              style={[mStyle.datePickerBtn, { flex: 1, marginBottom: 0 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[mStyle.datePickerText, !form.deadline && { color: COLORS.textLight }]}>
                {form.deadline ? form.deadline : 'Pilih Tanggal'}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[mStyle.datePickerBtn, { flex: 1, marginBottom: 0 }]}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
              disabled={!form.deadline}
            >
              <Text style={[mStyle.datePickerText, !form.deadline && { color: COLORS.textDisabled }]}>
                {form.time}
              </Text>
              <MaterialIcons name="access-time" size={20} color={form.deadline ? COLORS.primary : COLORS.textDisabled} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <CustomDatePicker
              visible={showDatePicker}
              value={form.deadline}
              onClose={() => setShowDatePicker(false)}
              onSelect={(date) => {
                setForm(p => ({ ...p, deadline: date }));
                setShowDatePicker(false);
              }}
            />
          )}

          {showTimePicker && (
            <CustomTimePicker
              visible={showTimePicker}
              value={form.time}
              onClose={() => setShowTimePicker(false)}
              onSelect={(time) => {
                setForm(p => ({ ...p, time }));
                setShowTimePicker(false);
              }}
            />
          )}

          <Text style={mStyle.label}>Ingatkan saya (Jam Sebelum Deadline)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {['0', '1', '2', '5', '12', '24'].map(h => {
              const active = form.reminderHours === h;
              return (
                <TouchableOpacity key={h} onPress={() => set('reminderHours')(h)}
                  style={[mStyle.chip, active && { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }]}>
                  <Text style={[mStyle.chipText, active && { color: COLORS.primary }]}>
                    {h === '0' ? 'Tidak Ada' : `${h} Jam`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[mStyle.label, { marginBottom: 0 }]}>Tugas Berulang</Text>
            <TouchableOpacity onPress={() => setForm(p => ({ ...p, isRecurring: !p.isRecurring }))}>
              <MaterialIcons
                name={form.isRecurring ? "toggle-on" : "toggle-off"}
                size={40}
                color={form.isRecurring ? COLORS.success : COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {form.isRecurring && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {[
                { id: 'HARIAN', label: 'Harian' },
                { id: 'MINGGUAN', label: 'Mingguan' },
                { id: 'BULANAN', label: 'Bulanan' },
              ].map(r => {
                const active = form.recurrence === r.id;
                return (
                  <TouchableOpacity key={r.id} onPress={() => set('recurrence')(r.id)}
                    style={[mStyle.chip, active && { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }]}>
                    <Text style={[mStyle.chipText, active && { color: COLORS.primary }]}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Text style={mStyle.label}>Daftar Sub-Tugas</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <TextInput
              style={[mStyle.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Contoh: Beli susu, Kerjakan bab 1..."
              value={newSubTask}
              onChangeText={setNewSubTask}
            />
            <TouchableOpacity
              style={[mStyle.addBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => {
                if (!newSubTask.trim()) return;
                setForm(p => ({ ...p, subtasks: [...p.subtasks, { title: newSubTask.trim() }] }));
                setNewSubTask('');
              }}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {form.subtasks.map((st, i) => (
            <View key={st.id || `new-${i}`} style={mStyle.subTaskItem}>
              <TouchableOpacity onPress={() => {
                setForm(p => ({
                  ...p,
                  subtasks: p.subtasks.map((s, idx) => idx === i ? { ...s, isDone: !s.isDone } : s)
                }));
              }}>
                <MaterialIcons
                  name={st.isDone ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={st.isDone ? COLORS.success : COLORS.textMuted}
                />
              </TouchableOpacity>
              <Text style={[mStyle.subTaskText, st.isDone && { textDecorationLine: 'line-through', color: COLORS.textLight }]}>{st.title}</Text>
              <TouchableOpacity onPress={() => {
                setForm(p => ({ ...p, subtasks: p.subtasks.filter((_, idx) => idx !== i) }));
              }}>
                <MaterialIcons name="remove-circle-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 20 }} />

          <Text style={mStyle.label}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {[{ id: '', name: 'Tanpa Kategori', color: COLORS.textMuted }, ...categories].map(c => {
              const active = form.categoryId === String(c.id);
              return (
                <TouchableOpacity key={String(c.id)} onPress={() => set('categoryId')(String(c.id))}
                  style={[mStyle.chip, active && { backgroundColor: c.color + '22', borderColor: c.color }]}>
                  <Text style={[mStyle.chipText, active && { color: c.color }]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TaskListScreen({ route }) {
  const qc = useQueryClient();
  const initialFilter = route?.params?.initialFilter || {};
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: initialFilter.status || '', priority: '', categoryId: '' });
  const [sortKey, setSortKey] = useState('createdAt-desc');
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [initialDate, setInitialDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [successData, setSuccessData] = useState(null);
  const statusRef = useRef(null);

  useEffect(() => {
    if (route?.params?.openAddModal) {
      setEditTask(null);
      setInitialDate(route.params.initialDate || '');
      setShowForm(true);
    }

    // Handle initialFilter from navigation (Dashboard Stat Cards)
    if (route?.params?.initialFilter) {
      setFilters(prev => ({
        ...prev,
        status: route.params.initialFilter.status || ''
      }));
    }
  }, [route?.params]);

  const CHIP_DATA = [{ id: '', label: 'Semua' }, ...STATUSES.map(s => ({ id: s, label: (STATUS_CONFIG[s] || STATUS_CONFIG['SEDANG_DIKERJAKAN']).label }))];

  useEffect(() => {
    const idx = CHIP_DATA.findIndex(c => c.id === filters.status);
    if (idx !== -1 && statusRef.current) {
      statusRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [filters.status]);

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey) || SORT_OPTIONS[0];

  const activeFilters = Object.fromEntries(
    Object.entries({ ...filters, search, sort: currentSort.sort, order: currentSort.order }).filter(([, v]) => v)
  );
  const filterCount = Object.values(filters).filter(Boolean).length;

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', activeFilters],
    queryFn: () => taskAPI.getAll(activeFilters).then(r => r.data.data),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data.data),
  });

  const invalidate = async () => {
    await qc.resetQueries({ queryKey: ['tasks'] });
    await qc.resetQueries({ queryKey: ['dashboard'] });
    refetch();
  };

  const createMut = useMutation({
    mutationFn: taskAPI.create,
    onSuccess: async (res) => {
      await invalidate();
      setShowForm(false);
      setSearch('');
      setFilters({ status: '', categoryId: '', priority: '' });

      if (res.data?.data) {
        // Tampilkan modal interaktif di tengah layar
        setSuccessData({
          title: 'Tugas Ditambahkan',
          subtitle: res.data.data.title,
          deadline: res.data.data.deadline ? formatDateTime(res.data.data.deadline) : null
        });

        // Jadwalkan pengingat deadline
        scheduleTaskNotification(res.data.data);
      }
    },
    onError: (err) => setToast({ visible: true, message: err.response?.data?.message || 'Gagal menambah tugas.', type: 'danger' }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => taskAPI.update(id, data),
    onMutate: async (newUpdate) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prevTasksData = qc.getQueriesData({ queryKey: ['tasks'] });

      qc.setQueriesData({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old;
        return old.map(t => Number(t.id) === Number(newUpdate.id) ? { ...t, ...newUpdate.data } : t);
      });

      return { prevTasksData };
    },
    onError: (err, newUpdate, context) => {
      if (context?.prevTasksData) {
        context.prevTasksData.forEach(([queryKey, oldData]) => {
          qc.setQueryData(queryKey, oldData);
        });
      }
      setToast({ visible: true, message: err.response?.data?.message || 'Gagal memperbarui tugas.', type: 'danger' });
    },
    onSuccess: async (res, variables) => {
      await invalidate();
      setShowForm(false);
      setEditTask(null);

      if (res.data?.data && variables?.skipNotify !== true) {
        scheduleTaskNotification(res.data.data);
      }
    }
  });
  const deleteMut = useMutation({
    mutationFn: taskAPI.delete,
    onSuccess: async (_, id) => {
      await invalidate();
      cancelTaskNotification(id);
      setToast({ visible: true, message: 'Tugas berhasil dihapus!', type: 'success' });
    },
    onError: (err) => setToast({ visible: true, message: err.response?.data?.message || 'Gagal menghapus tugas.', type: 'danger' }),
  });

  const handleSubmit = (data) => {
    if (editTask) {
      updateMut.mutate({ id: editTask.id, data });
    } else {
      createMut.mutate(data);
    }
  };
  const handleEdit = (task) => { setEditTask(task); setInitialDate(''); setShowForm(true); };
  const handleDelete = (id) => setConfirmDelete(id);
  const handleStatus = (id, status) => {
    // Animasi instan & pindah tab tanpa menunggu server (Optimistic Feel)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilters(prev => ({ ...prev, status }));

    updateMut.mutate({ id, data: { status }, skipNotify: true });
  };

  const handleSubtaskToggle = (taskId, subtaskId) => {
    subtaskAPI.toggle(taskId, subtaskId).then(() => {
      invalidate();
    }).catch(err => {
      setToast({ visible: true, message: 'Gagal memperbarui sub-tugas.', type: 'danger' });
    });
  };

  const handleAddSubtask = (taskId, title) => {
    subtaskAPI.create(taskId, { title }).then(() => {
      invalidate();
    }).catch(err => {
      setToast({ visible: true, message: 'Gagal menambah sub-tugas.', type: 'danger' });
    });
  };

  const handleReset = () => {
    setSearch('');
    setFilters({ status: '', priority: '', categoryId: '' });
    setSortKey('createdAt-desc');
    setToast({ visible: true, message: 'Filter telah dikosongkan.', type: 'info' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Daftar Tugas</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
          <TextInput
            placeholder="Cari Tugas..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialIcons name="cancel" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]} onPress={() => setShowFilter(true)}>
          <Ionicons
            name="filter-outline"
            size={22}
            color={filterCount > 0 ? COLORS.primary : COLORS.textMuted}
          />
          {filterCount > 0 && (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{filterCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 50, marginBottom: 4 }}>
        <FlatList
          ref={statusRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CHIP_DATA}
          keyExtractor={item => item.id || 'ALL'}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 8 }}
          onScrollToIndexFailed={() => { }}
          renderItem={({ item }) => {
            const active = filters.status === item.id;
            const cfg = item.id ? (STATUS_CONFIG[item.id] || STATUS_CONFIG['SEDANG_DIKERJAKAN']) : { bg: COLORS.primaryLight, text: COLORS.primary, dot: COLORS.primary };
            return (
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setFilters(f => ({ ...f, status: item.id }));
                }}
                style={[styles.chip, active && { backgroundColor: cfg.bg, borderColor: cfg.dot }]}
              >
                <Text style={[styles.chipText, active && { color: cfg.text }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <SectionList
        sections={groupTasksByDate(tasks)}
        keyExtractor={t => String(t.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <MaterialIcons name={section.icon} size={18} color={COLORS.textMuted} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatus}
            onSubtaskToggle={handleSubtaskToggle}
            onAddSubtask={handleAddSubtask}
          />
        )}
        ListEmptyComponent={isLoading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </View>
        ) : (
          <EmptyState
            iconName="inbox"
            title="Tidak ada tugas"
            subtitle={search || filterCount ? 'Coba ubah filter pencarian.' : 'Ketuk + untuk menambahkan tugas pertamamu!'}
          />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => { setEditTask(null); setShowForm(true); }} activeOpacity={0.85}>
        <MaterialIcons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <FilterSheet
        visible={showFilter}
        filters={filters}
        sortKey={sortKey}
        onSortChange={setSortKey}
        categories={categories}
        onApply={setFilters}
        onClose={() => setShowFilter(false)}
        onReset={handleReset}
      />

      <TaskFormModal
        visible={showForm}
        task={editTask}
        initialDate={initialDate}
        categories={categories}
        isLoading={createMut.isPending || updateMut.isPending}
        onClose={() => { setShowForm(false); setEditTask(null); setInitialDate(''); }}
        onSubmit={handleSubmit}
      />

      <SuccessModal
        visible={!!successData}
        title={successData?.title}
        subtitle={successData?.subtitle}
        deadline={successData?.deadline}
        onClose={() => setSuccessData(null)}
      />

      <ConfirmModal
        visible={!!confirmDelete}
        title="Hapus Tugas?"
        message="Tugas ini akan dihapus secara permanen dari daftar Anda."
        confirmText="Hapus"
        loading={deleteMut.isPending}
        onConfirm={() => {
          deleteMut.mutate(confirmDelete, {
            onSuccess: () => setConfirmDelete(null)
          });
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', ...SHADOW.md },
  headerTitle: { fontSize: 20, ...FONT.bold, color: '#FFF' },
  searchRow: { flexDirection: 'row', gap: 10, padding: 16, marginTop: 10, zIndex: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', height: 52, ...SHADOW.sm },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text, ...FONT.medium },
  filterBtn: { width: 52, height: 52, backgroundColor: COLORS.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOW.sm },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F1F5F9' },
  filterBtnText: { fontSize: 18, color: COLORS.textMuted },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', ...FONT.bold },
  chipBar: { flexGrow: 0, marginBottom: 4, height: 56 },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textMuted, ...FONT.medium, textAlign: 'center' },
  chipTextActive: { color: COLORS.primary },
  sortBar: { flexGrow: 0, marginBottom: 8, height: 34 },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderLight },
  sortChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  sortChipText: { fontSize: 11, color: COLORS.textMuted, ...FONT.medium },
  sortChipTextActive: { color: COLORS.primary, ...FONT.semibold },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12, marginLeft: 4 },
  sectionTitle: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBadge: { backgroundColor: COLORS.borderLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 4 },
  sectionBadgeText: { fontSize: 10, ...FONT.bold, color: COLORS.textMuted },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, backgroundColor: '#3b82f6', borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
  fabIcon: { fontSize: 26, color: '#fff', lineHeight: 30 },
});

const mStyle = StyleSheet.create({
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_MAX_HEIGHT, backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...SHADOW.lg },
  dragArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  title: { fontSize: 16, ...FONT.bold, color: COLORS.text },
  cancel: { fontSize: 14, color: COLORS.textMuted },
  save: { fontSize: 14, color: COLORS.primary, ...FONT.semibold, textAlign: 'center' },
  body: { padding: 20, paddingBottom: 250 },
  label: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, marginBottom: 8 },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 15,
    color: COLORS.text,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
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

const fStyle = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { width: 40, height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3, alignSelf: 'center', marginBottom: 16, marginTop: -8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, ...FONT.bold, color: COLORS.text },
  reset: { fontSize: 13, color: COLORS.primary, ...FONT.medium },
  secLabel: { fontSize: 12, ...FONT.semibold, color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.2, borderColor: COLORS.border, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 },
  chipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, ...SHADOW.sm },
  chipText: { fontSize: 13, ...FONT.medium, color: COLORS.textMuted, textAlign: 'center' },
  chipTextActive: { color: COLORS.primary, ...FONT.bold },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  footer: { marginTop: 12 },
});
