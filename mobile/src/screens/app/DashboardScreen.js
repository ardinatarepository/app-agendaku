// DashboardScreen - Fixed
// Perbaikan: ikon menggunakan @expo/vector-icons (Ionicons)

import { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, StyleSheet, StatusBar,
} from 'react-native';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { taskAPI } from '../../api';
import TaskCard from '../../components/TaskCard';
import { Card, Skeleton, TaskSkeleton, Divider } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW } from '../../utils/theme';
import { formatDate, formatDateTime, isOverdue } from '../../utils/helpers';
import { rescheduleAllNotifications } from '../../utils/notifications';
import { AVATAR_URL } from '../../config';

const StatCard = ({ label, value, color, iconName, onPress }) => (
  <TouchableOpacity 
    style={styles.statCard} 
    onPress={onPress} 
    activeOpacity={0.75}
  >
    <View style={styles.statHeader}>
      <Text style={[styles.statValue, { color: COLORS.text }]}>{value}</Text>
      <MaterialIcons name={iconName} size={24} color={color} style={styles.statWave} />
    </View>
    <View style={styles.statFooter}>
      <Text style={styles.statLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={18} color={COLORS.textLight} />
    </View>
  </TouchableOpacity>
);

const ProgressBar = ({ selesai, total }) => {
  const pct  = total > 0 ? Math.round((selesai / total) * 100) : 0;
  const fill = total > 0 ? selesai / total : 0;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressText}>{selesai} dari {total} tugas selesai ({pct}%)</Text>
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => taskAPI.getDashboard().then(r => r.data.data),
  });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      qc.invalidateQueries({ queryKey: ['tasks'] })
    ]);
    setRefreshing(false);
  }, [refetch, qc]);

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', {}],
    queryFn:  () => taskAPI.getAll({}).then(r => r.data.data),
  });

  // Refresh data saat layar difokuskan (tanpa memunculkan animasi loading/kedut)
  useFocusEffect(
    useCallback(() => {
      refetch();
      qc.invalidateQueries({ queryKey: ['tasks'] });
    }, [refetch, qc])
  );

  useEffect(() => {
    if (allTasks.length > 0) {
      rescheduleAllNotifications(allTasks).catch(() => {});
    }
  }, [allTasks]);

  const stats         = data?.stats || {};
  const tugasDeadline = data?.tugasMendekatiDeadline || [];
  const tugasTerlewat = data?.tugasTerlewat || [];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tugasHariIni = allTasks.filter(t => {
    if (t.status === 'SELESAI' || !t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
    return dl.getTime() === today.getTime();
  });

  const goToTasks = (filter = {}) => navigation.navigate('Tugas', { initialFilter: filter });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header (Top Bar) */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subtitle}>Bagaimana rencanamu hari ini?</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profil')}
          style={styles.avatarContainer}
        >
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar.startsWith('http') ? user.avatar : `${AVATAR_URL}${user.avatar}?t=${new Date().getTime()}` }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {isLoading ? (
          <>
            <View style={styles.statCard}><Skeleton width={24} height={24} style={{ marginBottom: 8 }} /><Skeleton width={40} height={20} style={{ marginBottom: 4 }} /><Skeleton width={60} height={12} /></View>
            <View style={styles.statCard}><Skeleton width={24} height={24} style={{ marginBottom: 8 }} /><Skeleton width={40} height={20} style={{ marginBottom: 4 }} /><Skeleton width={60} height={12} /></View>
            <View style={styles.statCard}><Skeleton width={24} height={24} style={{ marginBottom: 8 }} /><Skeleton width={40} height={20} style={{ marginBottom: 4 }} /><Skeleton width={60} height={12} /></View>
            <View style={styles.statCard}><Skeleton width={24} height={24} style={{ marginBottom: 8 }} /><Skeleton width={40} height={20} style={{ marginBottom: 4 }} /><Skeleton width={60} height={12} /></View>
          </>
        ) : (
          <>
            <StatCard label="Total"      value={stats.total            ?? 0} color={COLORS.text}    iconName="assignment"   onPress={() => goToTasks({})} />
            <StatCard label="Dikerjakan" value={stats.sedangDikerjakan ?? 0} color="#2563eb"        iconName="bolt"         onPress={() => goToTasks({ status: 'SEDANG_DIKERJAKAN' })} />
            <StatCard label="Selesai"    value={stats.selesai          ?? 0} color={COLORS.success} iconName="check-circle" onPress={() => goToTasks({ status: 'SELESAI' })} />
            <StatCard label="Terlewat"   value={stats.terlewat         ?? 0} color={COLORS.danger}  iconName="error"        onPress={() => goToTasks({ status: 'TERLEWAT' })} />
          </>
        )}
      </View>

      {/* Peringatan Tugas Terlewat */}
      {tugasTerlewat.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>⚠ Peringatan: Tugas Terlewat</Text>
          {tugasTerlewat.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              readonly={true} 
              onPress={() => goToTasks({ status: 'TERLEWAT' })}
            />
          ))}
        </View>
      )}

      {/* Progress Section */}
      <View style={styles.section}>
        <Card style={{ padding: 16 }}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 8 }]}>Progress Tugas</Text>
          <Divider style={{ marginBottom: 16, marginTop: 4 }} />
          {isLoading ? (
            <View style={{ gap: 8 }}>
              <Skeleton width="100%" height={12} borderRadius={6} />
              <Skeleton width="70%" height={12} />
            </View>
          ) : (
            <>
              <ProgressBar selesai={stats.selesai ?? 0} total={stats.total ?? 0} />
              
              <View style={styles.insightBox}>
                <Text style={styles.insightText}>
                  {stats.total > 0 
                    ? `Kamu sudah menyelesaikan ${Math.round((stats.selesai/stats.total)*100)}% tugas. Semangat!` 
                    : 'Mulai kerjakan tugasmu hari ini!'}
                </Text>
              </View>
            </>
          )}
        </Card>
      </View>

      {/* Tugas Hari Ini */}
      <View style={styles.section}>
        <Card style={{ padding: 16 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Tugas Hari Ini</Text>
          <Divider style={{ marginBottom: 16, marginTop: 4 }} />
          
          {isLoading ? (
            <View>
              <TaskSkeleton />
              <TaskSkeleton />
            </View>
          ) : tugasHariIni.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontSize: 13, ...FONT.semibold, color: COLORS.text }}>Tidak ada tugas hari ini</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>Tambah tugas baru atau cek daftar lengkap</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {tugasHariIni.map(task => (
                <TouchableOpacity key={task.id} onPress={() => goToTasks({})} activeOpacity={0.85}>
                  <View style={[styles.taskRow, { paddingVertical: 4 }]}>
                    <View style={[styles.taskDot, {
                      backgroundColor: { SEDANG_DIKERJAKAN: '#3b82f6', SELESAI: COLORS.success }[task.status],
                    }]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, { fontSize: 13 }]} numberOfLines={1}>{task.title}</Text>
                      <View style={[styles.taskMeta, { marginTop: 2 }]}>
                        {task.category && <Text style={[styles.taskCat, { fontSize: 10, color: task.category.color }]}>{task.category.name}</Text>}
                      </View>
                    </View>
                    <View style={styles.taskBadge}><Text style={styles.taskBadgeText}>Hari ini</Text></View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>
      </View>

      {/* Mendekati Deadline */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Card style={{ padding: 16 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Mendekati Deadline</Text>
          <Divider style={{ marginBottom: 16, marginTop: 4 }} />

          {tugasDeadline.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Ionicons name="happy" size={28} color={COLORS.success} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 13, ...FONT.semibold, color: COLORS.text }}>Semua deadline aman!</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {tugasDeadline.map(task => {
                const over = isOverdue(task.deadline);
                return (
                  <TouchableOpacity key={task.id} onPress={() => goToTasks({})} activeOpacity={0.85}>
                    <View style={[styles.deadlineRow, over && { opacity: 0.8 }, { paddingVertical: 4 }]}>
                      <View style={[styles.urgentDot, { backgroundColor: over ? COLORS.danger : COLORS.warning }]} />
                      <View style={styles.deadlineInfo}>
                        <Text style={[styles.deadlineTitle, { fontSize: 13 }]} numberOfLines={1}>{task.title}</Text>
                      </View>
                      <View style={[styles.deadlineDateWrap, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                        <Text style={[styles.deadlineUrgency, { fontSize: 10, color: over ? COLORS.danger : COLORS.warning }]}>{over ? 'Terlambat' : 'Segera'}</Text>
                        <Text style={[styles.deadlineDate, { fontSize: 10 }]}>{format(new Date(task.deadline), 'HH:mm')}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.bg },
  content:         { padding: 20, paddingBottom: 100 },
  topBar: { 
    backgroundColor: COLORS.surface, 
    padding: 24, 
    paddingTop: 60, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    ...SHADOW.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  topBarLeft: { flex: 1 },
  greeting:        { fontSize: 24, ...FONT.bold, color: COLORS.text, letterSpacing: 0.5 },
  subtitle:        { fontSize: 13, color: COLORS.textMuted, marginTop: 4, ...FONT.medium },
  avatarContainer: { ...SHADOW.md },
  avatar:          { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary, overflow: 'hidden' },
  avatarImage:     { width: '100%', height: '100%' },
  avatarText:      { fontSize: 22, ...FONT.bold, color: COLORS.primary },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20, marginTop: 10 },
  statCard:        { width: '48%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  statHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statValue:       { fontSize: 32, ...FONT.bold, color: COLORS.text },
  statWave:        { marginTop: -2, marginRight: -2 },
  statFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  statLabel:       { fontSize: 12, color: COLORS.textMuted, ...FONT.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressWrap:    { marginBottom: 8 },
  progressBarBg:   { height: 12, borderRadius: 6, backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: 12, backgroundColor: COLORS.success, borderRadius: 6 },
  progressText:    { fontSize: 13, color: COLORS.text, ...FONT.semibold },
  insightBox:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  insightText:     { fontSize: 13, color: COLORS.textMuted, flex: 1, lineHeight: 20 },
  section:         { marginTop: 28 },
  sectionTitle:    { fontSize: 16, ...FONT.bold, color: COLORS.text, marginBottom: 12, marginLeft: 4 },
  taskRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskDot:         { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskInfo:        { flex: 1 },
  taskTitle:       { fontSize: 14, ...FONT.bold, color: COLORS.text },
  taskMeta:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  taskCat:         { fontSize: 11, ...FONT.semibold },
  taskBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: '#fee2e220', borderWidth: 1, borderColor: '#ef444440' },
  taskBadgeText:   { fontSize: 10, ...FONT.bold, color: '#f87171' },
  deadlineRow:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  urgentDot:       { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  deadlineInfo:    { flex: 1 },
  deadlineTitle:   { fontSize: 14, ...FONT.bold, color: COLORS.text },
  deadlineDateWrap:{ alignItems: 'flex-end', gap: 4 },
  deadlineUrgency: { fontSize: 11, ...FONT.bold },
  deadlineDate:    { fontSize: 11, color: COLORS.textMuted, ...FONT.medium },
});
