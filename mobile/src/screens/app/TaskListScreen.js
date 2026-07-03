// TaskListScreen - Refactored
// Logic data fetching dan manajemen state utama tetap di sini.
// Komponen UI besar (TaskFormModal, FilterSheet) dipindah ke folder components.

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, SectionList, TouchableOpacity, TextInput,
  ScrollView, RefreshControl, StyleSheet, StatusBar, LayoutAnimation,
  Platform
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Logo from '../../components/Logo';
import { taskAPI, categoryAPI, subtaskAPI } from '../../api';
import { scheduleTaskNotification, cancelTaskNotification } from '../../utils/notifications';
import TaskCard from '../../components/TaskCard';
import SuccessModal from '../../components/SuccessModal';
import TaskFormModal from '../../components/TaskFormModal';
import FilterSheet from '../../components/FilterSheet';
import { Button, EmptyState, Card, ConfirmModal, Toast, TaskSkeleton } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/theme';
import { setTabBarVisible, resetTabBarVisible } from '../../utils/tabBarControl';
import { groupTasksByDate, formatDateTime } from '../../utils/helpers';

const STATUSES = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];

const SORT_OPTIONS = [
  { key: 'createdAt-desc', label: 'Terbaru',       sort: 'createdAt', order: 'desc' },
  { key: 'deadline-asc',   label: 'Deadline',      sort: 'deadline',  order: 'asc' },
  { key: 'priority-desc',  label: 'Prioritas',     sort: 'priority',  order: 'desc' },
  { key: 'title-asc',      label: 'Judul A-Z',     sort: 'title',     order: 'asc' },
];

export default function TaskListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const initialFilter = route?.params?.initialFilter || {};
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: initialFilter.status || '', priority: '', categoryId: '' });
  const [sortKey, setSortKey] = useState('createdAt-desc');
  const [headerHeight, setHeaderHeight] = useState(60);
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [initialDate, setInitialDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [successData, setSuccessData] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const statusRef = useRef(null);
  const listRef = useRef(null);

  // Sync route params
  useEffect(() => {
    let hasChanged = false;

    if (route?.params?.openAddModal) {
      setEditTask(null);
      setInitialDate(route.params.initialDate || '');
      setShowForm(true);
      hasChanged = true;
    }
    
    if (route?.params?.initialFilter) {
      const newStatus = route.params.initialFilter.status ?? '';
      setFilters(prev => ({ ...prev, status: newStatus }));
      hasChanged = true;
    }

    if (route?.params?.highlightId) {
      setHighlightedId(route.params.highlightId);
      hasChanged = true;
    }

    // Bersihkan params setelah dikonsumsi agar tidak re-trigger
    if (hasChanged) {
      navigation.setParams({ 
        highlightId: undefined, 
        initialFilter: undefined, 
        openAddModal: undefined,
        initialDate: undefined,
        timestamp: undefined
      });
    }
  }, [route?.params, navigation]);

  // Efek untuk membersihkan highlight id setelah beberapa saat
  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => setHighlightedId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  const CHIP_DATA = [{ id: '', label: 'Semua' }, ...STATUSES.map(s => ({ id: s, label: (STATUS_CONFIG[s] || STATUS_CONFIG['SEDANG_DIKERJAKAN']).label }))];

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey) || SORT_OPTIONS[0];
  const activeFilters = Object.fromEntries(Object.entries({ ...filters, search, sort: currentSort.sort, order: currentSort.order }).filter(([, v]) => v));
  const filterCount = Object.values(filters).filter(Boolean).length;

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', activeFilters],
    queryFn: () => taskAPI.getAll(activeFilters).then(r => {
      let list = r.data.data || [];
      if (!filters.status) {
        list = list.filter(t => t.status !== 'TERLEWAT');
      }
      return list;
    }),
  });

  useEffect(() => {
    const idx = CHIP_DATA.findIndex(c => c.id === filters.status);
    if (idx !== -1 && statusRef.current) {
      statusRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [filters.status]);

  // Handle auto-scroll to highlighted task
  useEffect(() => {
    // Hanya jalan jika ada ID yang di-highlight dan data sudah tersedia & tidak sedang loading
    if (highlightedId && tasks.length > 0 && !isLoading) {
      const sections = groupTasksByDate(tasks);
      let foundSection = -1;
      let foundItem = -1;

      sections.forEach((sec, sIdx) => {
        const iIdx = sec.data.findIndex(t => t.id === highlightedId);
        if (iIdx !== -1) {
          foundSection = sIdx;
          foundItem = iIdx;
        }
      });

      if (foundSection !== -1 && listRef.current) {
        // Gunakan requestAnimationFrame untuk memastikan render selesai
        const timer = setTimeout(() => {
          try {
            listRef.current?.scrollToLocation({
              sectionIndex: foundSection,
              itemIndex: foundItem,
              animated: true,
              viewPosition: 0.2
            });
          } catch (e) {
            console.log('Scroll error:', e);
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedId, tasks, isLoading]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data.data),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMut = useMutation({
    mutationFn: taskAPI.create,
    onSuccess: (res) => {
      invalidate();
      setShowForm(false);
      if (res.data?.data) {
        setSuccessData({
          title: 'Tugas Berhasil Dibuat!',
          subtitle: res.data.data.title,
          deadline: res.data.data.deadline ? formatDateTime(res.data.data.deadline) : null
        });
        scheduleTaskNotification(res.data.data);
      }
    },
    onError: () => setToast({ visible: true, message: 'Gagal menambah tugas.', type: 'danger' })
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => taskAPI.update(id, data),
    onSuccess: (res, variables) => {
      invalidate();
      setShowForm(false);
      setEditTask(null);
      if (res.data?.data && variables?.skipNotify !== true) scheduleTaskNotification(res.data.data);
      
      // Sinkronisasi otomatis filter tab jika status berubah (terutama untuk Undo)
      if (variables?.data?.status === 'SEDANG_DIKERJAKAN') {
        setFilters(f => ({ ...f, status: 'SEDANG_DIKERJAKAN' }));
      }
    },
    onError: () => setToast({ visible: true, message: 'Gagal memperbarui tugas.', type: 'danger' })
  });

  const deleteMut = useMutation({
    mutationFn: taskAPI.delete,
    onSuccess: (_, id) => {
      invalidate();
      cancelTaskNotification(id);
      setToast({ visible: true, message: 'Tugas berhasil dihapus.', type: 'success' });
    },
    onError: () => setToast({ visible: true, message: 'Gagal menghapus tugas.', type: 'danger' })
  });

  // ─── Auto-delete: hapus tugas SELESAI & TERLEWAT > 1 minggu ──────────────
  const autoCleanup = useCallback(async () => {
    try {
      const allRes = await taskAPI.getAll({ status: '', sort: 'createdAt', order: 'asc' });
      const allTasks = allRes.data.data || [];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const toDelete = allTasks.filter(t => {
        if (t.status !== 'SELESAI' && t.status !== 'TERLEWAT') return false;
        // Gunakan updatedAt atau createdAt sebagai referensi waktu
        const refDate = new Date(t.updatedAt || t.createdAt);
        return refDate < oneWeekAgo;
      });

      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(t => taskAPI.delete(t.id).catch(() => {})));
        invalidate();
        setToast({ 
          visible: true, 
          message: `${toDelete.length} tugas lama otomatis dihapus.`, 
          type: 'success' 
        });
      }
    } catch (e) {
      // Cleanup gagal = biarkan saja, tidak perlu error ke user
    }
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = (data) => {
    if (editTask) updateMut.mutate({ id: editTask.id, data });
    else createMut.mutate(data);
  };

  const handleEdit = (task) => { setEditTask(task); setShowForm(true); };
  const handleDelete = (id) => setConfirmDelete(id);
  const handleStatus = (id, status) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateMut.mutate({ id, data: { status }, skipNotify: true }, {
      onSuccess: () => {
        // Feedback instan kepada pengguna
        if (status === 'SELESAI') {
          setToast({ visible: true, message: 'Hebat! Tugas telah diselesaikan.', type: 'success' });
          // Otomatis pindah ke tab Selesai agar pengguna tahu tugasnya ada di sana
          setFilters(f => ({ ...f, status: 'SELESAI' }));
        } else if (status === 'SEDANG_DIKERJAKAN') {
          setToast({ visible: true, message: 'Tugas dikembalikan ke Berjalan.', type: 'success' });
          setFilters(f => ({ ...f, status: 'SEDANG_DIKERJAKAN' }));
        }
      }
    });
  };

  const handleSubtaskToggle = (taskId, subtaskId) => {
    subtaskAPI.toggle(taskId, subtaskId).then(invalidate);
  };

  const handleAddSubtask = (taskId, title) => {
    subtaskAPI.create(taskId, { title }).then(invalidate).catch(() => setToast({ visible: true, message: 'Gagal menambah sub-tugas.', type: 'danger' }));
  };

  const handleSubtaskDelete = (taskId, subtaskId) => {
    subtaskAPI.delete(taskId, subtaskId).then(invalidate).catch(() => setToast({ visible: true, message: 'Gagal menghapus sub-tugas.', type: 'danger' }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilters({ status: '', priority: '', categoryId: '' });
    setSortKey('createdAt-desc');
  };

  const scrollOffset = useRef(0);
  const isNavbarVisible = useRef(true);

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const currentOffset = contentOffset.y;
    const layoutHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;

    const direction = currentOffset > scrollOffset.current ? 'down' : 'up';
    const isAtBottom = currentOffset + layoutHeight >= contentHeight - 20;

    if (currentOffset <= 150) {
      if (!isNavbarVisible.current) {
        isNavbarVisible.current = true;
        setTabBarVisible(true);
      }
    } else if (direction === 'down' && isNavbarVisible.current) {
      isNavbarVisible.current = false;
      setTabBarVisible(false);
    } else if (direction === 'up' && !isNavbarVisible.current && !isAtBottom) {
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

      // Jalankan auto-cleanup setiap kali layar difokus
      autoCleanup();
    }, [autoCleanup])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>


      {/* Header removed for minimalist look */}

      {/* Top Header Area (Solid background clips task card shadows and prevents flickering) */}
      <View style={styles.topHeaderContainer}>
        {/* Search & Filter Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#4B5563" />
            <TextInput
              placeholder="Cari tugas..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Status Chips */}
        <View style={{ height: 42, marginBottom: 2 }}>
          <FlatList
            ref={statusRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CHIP_DATA}
            keyExtractor={item => item.id || 'ALL'}
            onScrollToIndexFailed={info => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                statusRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
              });
            }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 2, gap: 8 }}
            renderItem={({ item }) => {
              const active = filters.status === item.id;
              const config = STATUS_CONFIG[item.id] || { bg: COLORS.primary, text: '#000', dot: COLORS.primary };
              
              // Warna khusus untuk tab "Semua" agar tetap kontras
              const activeBg = item.id === '' ? COLORS.primary : config.bg;
              const activeText = item.id === '' ? '#000000' : config.text;
              const activeBorder = item.id === '' ? COLORS.primary : config.text;

              return (
                <TouchableOpacity
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setFilters(f => ({ ...f, status: item.id }));
                  }}
                  style={[
                    styles.chip, 
                    active && { 
                      backgroundColor: activeBg, 
                      borderColor: activeBorder,
                      borderWidth: item.id === '' ? 1 : 1.5 
                    }
                  ]}
                >
                  <Text style={[
                    styles.chipText, 
                    active && { color: activeText, ...FONT.bold }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {/* Task List */}
      <SectionList
        ref={listRef}
        sections={groupTasksByDate(tasks)}
        keyExtractor={t => String(t.id)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        renderSectionHeader={({ section }) => {
          const isTerlewat = section.title === 'Terlewat';
          return (
            <View style={styles.sectionHeader}>
              <Ionicons 
                name={
                  isTerlewat ? 'alert-circle-outline' :
                  section.icon === 'today' ? 'sunny-outline' : 
                  section.icon === 'event' ? 'calendar-outline' : 
                  section.icon === 'upcoming' ? 'calendar-clear-outline' : 
                  'document-text-outline'
                } 
                size={16} 
                color={isTerlewat ? '#EF4444' : '#808080'} 
              />
              <Text style={[styles.sectionTitle, isTerlewat && { color: '#EF4444' }]}>{section.title}</Text>
              <View style={[styles.sectionCountBadge, isTerlewat && { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.sectionCountText, isTerlewat && { color: '#EF4444' }]}>{section.data.length}</Text>
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            isHighlighted={item.id === highlightedId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatus}
            onSubtaskToggle={handleSubtaskToggle}
            onAddSubtask={handleAddSubtask}
            onSubtaskDelete={handleSubtaskDelete}
          />
        )}
        ListEmptyComponent={isLoading ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <TaskSkeleton /><TaskSkeleton /><TaskSkeleton /><TaskSkeleton />
          </View>
        ) : (
          <EmptyState
            iconName="inbox"
            title="Tidak ada tugas"
            subtitle={search || filterCount ? 'Coba ubah filter pencarian.' : 'Ketuk + untuk menambahkan tugas pertamamu!'}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setEditTask(null); setShowForm(true); }} activeOpacity={0.85}>
        <MaterialIcons name="add" size={32} color="#000000" />
      </TouchableOpacity>

      {/* Modals */}
      <FilterSheet
        visible={showFilter}
        filters={filters}
        sortKey={sortKey}
        onSortChange={setSortKey}
        categories={categories}
        onApply={setFilters}
        onClose={() => setShowFilter(false)}
        onReset={handleResetFilters}
        statusConfig={STATUS_CONFIG}
        priorityConfig={PRIORITY_CONFIG}
      />

      <TaskFormModal
        visible={showForm}
        task={editTask}
        headerHeight={headerHeight}
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
        onConfirm={() => { deleteMut.mutate(confirmDelete, { onSuccess: () => setConfirmDelete(null) }); }}
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
  topHeaderContainer: {
    backgroundColor: COLORS.bg,
    zIndex: 10,
    paddingBottom: 4,
  },
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
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14, marginTop: 10, zIndex: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: '#D1D5DB', height: 48, ...SHADOW.sm },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, ...FONT.medium },
  filterBtn: { width: 48, height: 48, backgroundColor: '#FFFFFF', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB', ...SHADOW.sm },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', ...FONT.bold },
  chip: { paddingHorizontal: 16, height: 34, borderRadius: 17, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, color: COLORS.textMuted, ...FONT.medium, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 150 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 10, marginLeft: 4 },
  sectionTitle: { fontSize: 15, ...FONT.bold, color: '#1E293B', textTransform: 'capitalize', letterSpacing: 0 },
  sectionCountBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  sectionCountText: { fontSize: 12, ...FONT.bold, color: '#64748B' },
  fab: { 
    position: 'absolute', 
    bottom: 140, 
    right: 20, 
    width: 60, 
    height: 60, 
    backgroundColor: COLORS.primary, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
