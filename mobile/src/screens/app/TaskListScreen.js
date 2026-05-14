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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { taskAPI, categoryAPI, subtaskAPI } from '../../api';
import { scheduleTaskNotification, cancelTaskNotification } from '../../utils/notifications';
import TaskCard from '../../components/TaskCard';
import SuccessModal from '../../components/SuccessModal';
import TaskFormModal from '../../components/TaskFormModal';
import FilterSheet from '../../components/FilterSheet';
import { Button, EmptyState, Card, ConfirmModal, Toast, TaskSkeleton } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/theme';
import { groupTasksByDate, formatDateTime } from '../../utils/helpers';

const STATUSES = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];

const SORT_OPTIONS = [
  { key: 'createdAt-desc', label: 'Terbaru',       sort: 'createdAt', order: 'desc' },
  { key: 'deadline-asc',   label: 'Deadline',      sort: 'deadline',  order: 'asc' },
  { key: 'priority-desc',  label: 'Prioritas',     sort: 'priority',  order: 'desc' },
  { key: 'title-asc',      label: 'Judul A-Z',     sort: 'title',     order: 'asc' },
];

export default function TaskListScreen({ route }) {
  const qc = useQueryClient();
  const initialFilter = route?.params?.initialFilter || {};
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: initialFilter.status || '', priority: '', categoryId: '' });
  const [sortKey, setSortKey] = useState('createdAt-desc');
  const [headerHeight, setHeaderHeight] = useState(113);
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [initialDate, setInitialDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [successData, setSuccessData] = useState(null);
  const statusRef = useRef(null);

  // Sync route params
  useEffect(() => {
    if (route?.params?.openAddModal) {
      setEditTask(null);
      setInitialDate(route.params.initialDate || '');
      setShowForm(true);
    }
    if (route?.params?.initialFilter) {
      setFilters(prev => ({ ...prev, status: route.params.initialFilter.status || '' }));
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
  const activeFilters = Object.fromEntries(Object.entries({ ...filters, search, sort: currentSort.sort, order: currentSort.order }).filter(([, v]) => v));
  const filterCount = Object.values(filters).filter(Boolean).length;

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', activeFilters],
    queryFn: () => taskAPI.getAll(activeFilters).then(r => r.data.data),
  });

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
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] });

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

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = (data) => {
    if (editTask) updateMut.mutate({ id: editTask.id, data });
    else createMut.mutate(data);
  };

  const handleEdit = (task) => { setEditTask(task); setShowForm(true); };
  const handleDelete = (id) => setConfirmDelete(id);
  const handleStatus = (id, status) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateMut.mutate({ id, data: { status }, skipNotify: true });
  };

  const handleSubtaskToggle = (taskId, subtaskId, isDone) => {
    subtaskAPI.update(subtaskId, { isDone }).then(invalidate);
  };

  const handleAddSubtask = (taskId, title) => {
    subtaskAPI.create({ taskId, title }).then(invalidate).catch(() => setToast({ visible: true, message: 'Gagal menambah sub-tugas.', type: 'danger' }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilters({ status: '', priority: '', categoryId: '' });
    setSortKey('createdAt-desc');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View 
        style={styles.headerBar}
        onLayout={(e) => {
          const newHeight = Math.round(e.nativeEvent.layout.height);
          if (Math.abs(headerHeight - newHeight) > 2) {
            setHeaderHeight(newHeight);
          }
        }}
      >
        <Text style={styles.headerTitle}>Daftar Tugas</Text>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
          <TextInput
            placeholder="Cari tugas..."
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
          <Ionicons name="filter-outline" size={22} color={filterCount > 0 ? COLORS.primary : COLORS.textMuted} />
          {filterCount > 0 && (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{filterCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Status Chips */}
      <View style={{ height: 50, marginBottom: 4 }}>
        <FlatList
          ref={statusRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CHIP_DATA}
          keyExtractor={item => item.id || 'ALL'}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 8 }}
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

      {/* Task List */}
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
        <MaterialIcons name="add" size={32} color="#fff" />
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
  headerBar: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...SHADOW.md 
  },
  headerTitle: { fontSize: 20, ...FONT.bold, color: '#FFF' },
  searchRow: { flexDirection: 'row', gap: 10, padding: 16, marginTop: 10, zIndex: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', height: 52, ...SHADOW.sm },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.text, ...FONT.medium },
  filterBtn: { width: 52, height: 52, backgroundColor: COLORS.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOW.sm },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F1F5F9' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', ...FONT.bold },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, color: COLORS.textMuted, ...FONT.medium, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12, marginLeft: 4 },
  sectionTitle: { fontSize: 13, ...FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBadge: { backgroundColor: COLORS.borderLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 4 },
  sectionBadgeText: { fontSize: 10, ...FONT.bold, color: COLORS.textMuted },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, backgroundColor: '#2563EB', borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...SHADOW.md },
});
