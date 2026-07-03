// CalendarScreen - Tampilan tugas berdasarkan tanggal
// Tab baru pengganti Filter di bottom navigation

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl, StatusBar, Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Logo from '../../components/Logo';
import { taskAPI } from '../../api';
import { Card, EmptyState, Badge, Skeleton, CalendarTaskSkeleton, CategorySkeleton } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/theme';
import { setTabBarVisible, resetTabBarVisible } from '../../utils/tabBarControl';
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
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
  const prioritySymbol = { TINGGI: 'T', NORMAL: 'N', RENDAH: 'R' }[task.priority || 'NORMAL'];
  
  return (
    <TouchableOpacity style={tcard.wrap} onPress={() => onPress(task)} activeOpacity={0.85}>
      <View style={[tcard.bar, { backgroundColor: sc.dot }]} />
      <View style={tcard.body}>
        <Text style={tcard.title} numberOfLines={1}>{task.title}</Text>
        <View style={tcard.row}>
          <Badge label={sc.label} bg={sc.bg} color={sc.text} />
          
          <View style={[tcard.badgeSymbol, { backgroundColor: pc.bg }]}>
            <Text style={[tcard.badgeSymbolText, { color: pc.text }]}>{prioritySymbol}</Text>
          </View>

          {task.category && (
            <View style={[tcard.badgeSymbol, { backgroundColor: task.category.color + '22' }]}>
              <Text style={[tcard.badgeSymbolText, { color: task.category.color }]}>
                {task.category.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
    setSelectedDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`);
  };

  const selectedLabel = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]} ${y}`;
  })();

  const handleTaskPress = (task) => {
    navigation.navigate('Tugas', {
      highlightId: task.id,
      initialFilter: { status: task.status },
      timestamp: Date.now(),
    });
  };

  const handleAddAtDate = () => {
    navigation.navigate('Tugas', { 
      openAddModal: true, 
      initialDate: selectedDate,
      timestamp: Date.now() // Force route param change in React Navigation
    });
  };

  const scrollOffset = useRef(0);
  const isNavbarVisible = useRef(true);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset.current ? 'down' : 'up';
    
    if (currentOffset <= 150) {
      if (!isNavbarVisible.current) {
        isNavbarVisible.current = true;
        setTabBarVisible(true);
      }
    } else if (direction === 'down' && isNavbarVisible.current) {
      isNavbarVisible.current = false;
      setTabBarVisible(false);
    } else if (direction === 'up' && !isNavbarVisible.current) {
      isNavbarVisible.current = true;
      setTabBarVisible(true);
    }
    scrollOffset.current = currentOffset;
  };

  useFocusEffect(
    useCallback(() => {
      isNavbarVisible.current = true;
      resetTabBarVisible();

      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="transparent" translucent={true} />

      {/* Header removed for minimalist look */}

      <ScrollView 
        style={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
              <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddAtDate} activeOpacity={0.8}>
                <View style={styles.addMoreIconCircle}>
                  <MaterialIcons name="add" size={12} color="#000000" />
                </View>
                <Text style={styles.addMoreText}>Tambah Tugas di tanggal ini</Text>
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
  headerBar: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    ...SHADOW.md,
  },
  headerTitle: { fontSize: 20, ...FONT.bold, color: '#FFFFFF' },
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
  addBtnText: { color: '#000000', fontSize: 13, ...FONT.semibold, textAlign: 'center' },
  addMoreBtn: { 
    marginTop: 16, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12, 
    paddingHorizontal: 20,
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#000000', 
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    minWidth: 240,
  },
  addMoreIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: { fontSize: 12, color: '#000000', ...FONT.bold, textAlign: 'center' },
});

const cal = StyleSheet.create({
  container: {},
  dayLabels: { flexDirection: 'row', marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, ...FONT.semibold, color: COLORS.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cellSelected: { backgroundColor: COLORS.primary, borderRadius: 17 },
  cellToday: { backgroundColor: COLORS.primaryLight, borderRadius: 17 },
  dayNum: { fontSize: 13, color: COLORS.text, ...FONT.medium, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dayNumSelected: { color: '#000000', ...FONT.bold, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dayNumToday: { color: '#000000', ...FONT.bold, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});

const tcard = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOW.sm },
  bar: { width: 4, flexShrink: 0 },
  body: { flex: 1, padding: 12 },
  title: { fontSize: 14, ...FONT.bold, color: COLORS.text, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  badgeSymbol: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeSymbolText: { fontSize: 10, ...FONT.bold, includeFontPadding: false, textAlignVertical: 'center' },
});
