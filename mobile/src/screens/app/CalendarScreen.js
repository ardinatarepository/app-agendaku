// CalendarScreen - Tampilan tugas berdasarkan tanggal
// Tab baru pengganti Filter di bottom navigation

import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl, StatusBar,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { taskAPI } from '../../api';
import { Card, EmptyState, Badge, Skeleton, CalendarTaskSkeleton, CategorySkeleton } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/theme';
import { formatDate } from '../../utils/helpers';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ─── Helper ───────────────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ year, month, selectedDate, onSelectDate, taskDates }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={cal.container}>
      {/* Day labels */}
      <View style={cal.dayLabels}>
        {DAYS.map(d => (
          <Text key={d} style={cal.dayLabel}>{d}</Text>
        ))}
      </View>
      {/* Date cells */}
      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={cal.cell} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const taskInfo = taskDates[dateStr];
          const hasTinggi = taskInfo?.hasTinggi;
          const hasTask = !!taskInfo;

          return (
            <TouchableOpacity
              key={dateStr}
              style={cal.cell}
              onPress={() => onSelectDate(dateStr)}
              activeOpacity={0.7}
            >
              <View style={[
                cal.cellCircle,
                isSelected && cal.cellSelected,
                isToday && !isSelected && cal.cellToday
              ]}>
                <Text style={[
                  cal.dayNum,
                  isSelected && cal.dayNumSelected,
                  isToday && !isSelected && cal.dayNumToday
                ]}>
                  {day}
                </Text>
              </View>
              {hasTask && (
                <View style={[cal.dot, { backgroundColor: hasTinggi ? COLORS.danger : COLORS.warning }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Task Mini Card ───────────────────────────────────────────────────────────
function TaskMiniCard({ task, onPress }) {
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG['SEDANG_DIKERJAKAN'];
  const pc = PRIORITY_CONFIG[task.priority];
  return (
    <TouchableOpacity style={tcard.wrap} onPress={() => onPress(task)} activeOpacity={0.85}>
      <View style={[tcard.bar, { backgroundColor: sc.dot }]} />
      <View style={tcard.body}>
        <Text style={tcard.title} numberOfLines={1}>{task.title}</Text>
        <View style={tcard.row}>
          <Badge label={sc.label} bg={sc.bg} color={sc.text} />
          <Badge label={pc.label} bg={pc.bg} color={pc.text} />
          {task.category && (
            <Badge label={task.category.name} bg={task.category.color + '22'} color={task.category.color} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen({ navigation }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: allTasks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['tasks', { all: 'true' }],
    queryFn: () => taskAPI.getAll({ all: 'true' }).then(r => r.data.data),
  });

  // Buat map: dateStr → { hasTinggi, count }
  const taskDates = useMemo(() => {
    const map = {};
    allTasks.forEach(t => {
      if (!t.deadline) return;
      const d = t.deadline.split('T')[0];
      if (!map[d]) map[d] = { hasTinggi: false, count: 0 };
      map[d].count++;
      if (t.priority === 'TINGGI') map[d].hasTinggi = true;
    });
    return map;
  }, [allTasks]);

  // Tugas pada tanggal yang dipilih
  const selectedTasks = useMemo(() => {
    return allTasks.filter(t => t.deadline && t.deadline.split('T')[0] === selectedDate);
  }, [allTasks, selectedDate]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const selectedLabel = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  })();

  const handleTaskPress = (task) => {
    navigation.navigate('Tugas');
  };

  const handleAddAtDate = () => {
    navigation.navigate('Tugas', { 
      openAddModal: true, 
      initialDate: selectedDate 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Kalender Tugas</Text>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {/* ── Month navigation ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={12}>
            <MaterialIcons name="chevron-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToday} style={styles.monthWrap}>
            <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
            <Text style={styles.todayHint}>Ketuk untuk hari ini</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn} hitSlop={12}>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* ── Kalender mini ── */}
        <View style={styles.calCard}>
          <MiniCalendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            taskDates={taskDates}
          />
          {/* Legenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.legendText}>Prioritas tinggi</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>Ada tugas</Text>
            </View>
          </View>
        </View>

        {/* ── Tugas pada tanggal terpilih ── */}
        <View style={styles.section}>
          <View style={styles.sectionHdr}>
            <Text style={styles.sectionTitle}>Tugas — {selectedLabel}</Text>
            <Text style={styles.taskCount}>{selectedTasks.length} tugas</Text>
          </View>

          {isLoading ? (
            <View>
              <CalendarTaskSkeleton />
              <CalendarTaskSkeleton />
              <CalendarTaskSkeleton />
            </View>
          ) : selectedTasks.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                emoji="📭"
                title="Tidak ada tugas"
                subtitle={`Tidak ada tugas pada ${selectedLabel}`}
                action={
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddAtDate}>
                    <Text style={styles.addBtnText}>+ Tambah Tugas</Text>
                  </TouchableOpacity>
                }
              />
            </Card>
          ) : (
            <>
              {selectedTasks.map(task => (
                <TaskMiniCard key={task.id} task={task} onPress={handleTaskPress} />
              ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddAtDate}>
                <Text style={styles.addMoreText}>+ Tambah Tugas di tanggal ini</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', ...SHADOW.md },
  headerTitle: { fontSize: 20, ...FONT.bold, color: '#FFF' },
  monthNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginTop: 10 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  monthWrap: { flex: 1, alignItems: 'center' },
  monthTitle: { fontSize: 17, ...FONT.bold, color: COLORS.text },
  todayHint: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  calCard: { marginHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 20, ...SHADOW.sm },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted },
  section: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, ...FONT.bold, color: COLORS.text },
  taskCount: { fontSize: 12, color: COLORS.textMuted },
  skeleton: { height: 72, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.lg, marginBottom: 10 },
  emptyCard: { padding: 8 },
  addBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 13, ...FONT.semibold, textAlign: 'center' },
  addMoreBtn: { marginTop: 12, padding: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addMoreText: { fontSize: 13, color: COLORS.primary, ...FONT.semibold, textAlign: 'center' },
});

const cal = StyleSheet.create({
  container: {},
  dayLabels: { flexDirection: 'row', marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, ...FONT.semibold, color: COLORS.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: COLORS.primary },
  cellToday: { backgroundColor: COLORS.primaryLight },
  dayNum: { fontSize: 13, color: COLORS.text, ...FONT.medium, textAlign: 'center' },
  dayNumSelected: { color: '#fff', ...FONT.bold, textAlign: 'center' },
  dayNumToday: { color: COLORS.primary, ...FONT.bold, textAlign: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});

const tcard = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  bar: { width: 4, flexShrink: 0 },
  body: { flex: 1, padding: 12 },
  title: { fontSize: 14, ...FONT.bold, color: COLORS.text, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
});
