// DashboardScreen - Fixed
// Perbaikan: ikon menggunakan @expo/vector-icons (Ionicons)

import { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  RefreshControl, StyleSheet, StatusBar,
} from 'react-native';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { taskAPI } from '../../api';
import TaskCard from '../../components/TaskCard';
import { Card, EmptyState, Skeleton, TaskSkeleton } from '../../components/ui';
import { COLORS, FONT, RADIUS, SHADOW } from '../../utils/theme';
import { formatDate, formatDateTime, isOverdue } from '../../utils/helpers';
import { rescheduleAllNotifications } from '../../utils/notifications';
import { AVATAR_URL } from '../../config';

const StatCard = ({ label, value, color, iconName, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.75}>
    <MaterialIcons name={iconName} size={24} color={color} style={{ marginBottom: 6 }} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  () => taskAPI.getDashboard().then(r => r.data.data),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', {}],
    queryFn:  () => taskAPI.getAll({}).then(r => r.data.data),
  });

  // Refresh data saat layar difokuskan
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
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >

      {/* Header (Top Bar) */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.subtitle}>Selamat datang kembali di AgendaKu</Text>
        </View>
        <View style={[styles.avatar, { overflow: 'hidden' }]}>
          {user?.avatar ? (
            <Image 
              source={{ uri: `${AVATAR_URL}${user.avatar}?t=${new Date().getTime()}` }} 
              style={{ width: '100%', height: '100%' }} 
            />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          )}
        </View>
      </View>

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
            <StatCard label="Total"      value={stats.total            ?? 0} color={COLORS.text}    iconName="assignment"        onPress={() => goToTasks({})} />
            <StatCard label="Dikerjakan" value={stats.sedangDikerjakan ?? 0} color="#2563eb"        iconName="bolt"              onPress={() => goToTasks({ status: 'SEDANG_DIKERJAKAN' })} />
            <StatCard label="Selesai"    value={stats.selesai          ?? 0} color={COLORS.success} iconName="check-circle"      onPress={() => goToTasks({ status: 'SELESAI' })} />
            <StatCard label="Terlewat"   value={stats.terlewat         ?? 0} color={COLORS.danger}  iconName="error"             onPress={() => goToTasks({ status: 'TERLEWAT' })} />
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

      {/* Peringatan Mendekati Deadline */}
      {tugasDeadline.length > 0 && (
        <View style={styles.section}>
          <View style={styles.alertBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="time" size={18} color={COLORS.warning} />
              <Text style={[styles.alertTitle, { marginBottom: 0 }]}>Mendekati Deadline</Text>
            </View>
            {tugasDeadline.slice(0, 3).map(task => {
              const over = isOverdue(task.deadline);
              const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / 86400000);
              return (
                <View key={task.id} style={styles.alertItem}>
                  <View style={[styles.alertDot, { backgroundColor: over ? COLORS.danger : COLORS.warning }]} />
                  <Text style={[styles.alertText, { color: over ? COLORS.danger : '#92400e' }]} numberOfLines={1}>
                    {task.title} — {over ? 'Terlambat' : `${daysLeft} hari lagi`} ({format(new Date(task.deadline), 'HH:mm')})
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Tugas</Text>
        <Card style={{ padding: 16 }}>
          {isLoading ? (
            <View style={{ gap: 8 }}>
              <Skeleton width="100%" height={12} borderRadius={6} />
              <Skeleton width="70%" height={12} />
            </View>
          ) : (
            <>
              <ProgressBar selesai={stats.selesai ?? 0} total={stats.total ?? 0} />
              
              <View style={styles.insightBox}>
                <Ionicons name="analytics" size={20} color={COLORS.primary} />
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
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Tugas Hari Ini</Text>
          <TouchableOpacity onPress={() => goToTasks({})}>
            <View style={styles.seeAllBadge}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
              <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View>
            <TaskSkeleton />
            <TaskSkeleton />
          </View>
        ) : tugasHariIni.length === 0 ? (
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, ...FONT.semibold, color: COLORS.text }}>Tidak ada tugas hari ini</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' }}>Tambah tugas baru atau cek daftar lengkap</Text>
          </Card>
        ) : (
          tugasHariIni.map(task => (
            <TouchableOpacity key={task.id} onPress={() => goToTasks({})} activeOpacity={0.85}>
              <Card style={styles.taskCard}>
                <View style={styles.taskRow}>
                  <View style={[styles.taskDot, {
                    backgroundColor: { SEDANG_DIKERJAKAN: '#3b82f6', SELESAI: COLORS.success }[task.status],
                  }]} />
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={styles.taskMeta}>
                      {task.category && <Text style={[styles.taskCat, { color: task.category.color }]}>{task.category.name}</Text>}
                      <View style={styles.taskBadge}><Text style={styles.taskBadgeText}>Hari ini</Text></View>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Mendekati Deadline */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mendekati Deadline</Text>
          <TouchableOpacity onPress={() => goToTasks({})}>
            <View style={styles.seeAllBadge}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
              <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {tugasDeadline.length === 0 ? (
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <Ionicons name="happy" size={28} color={COLORS.success} style={{ marginBottom: 6 }} />
            <Text style={{ fontSize: 13, ...FONT.semibold, color: COLORS.text }}>Semua deadline aman!</Text>
          </Card>
        ) : (
          tugasDeadline.map(task => {
            const over = isOverdue(task.deadline);
            return (
              <TouchableOpacity key={task.id} onPress={() => goToTasks({})} activeOpacity={0.85}>
                <Card style={[styles.deadlineCard, over && styles.overdueCard]}>
                  <View style={styles.deadlineRow}>
                    <View style={[styles.urgentDot, { backgroundColor: over ? COLORS.danger : COLORS.warning }]} />
                    <View style={styles.deadlineInfo}>
                      <Text style={styles.deadlineTitle} numberOfLines={1}>{task.title}</Text>
                      {task.category && <Text style={[styles.deadlineCat, { color: task.category.color }]}>{task.category.name}</Text>}
                    </View>
                    <View style={styles.deadlineDateWrap}>
                      <Text style={[styles.deadlineUrgency, { color: over ? COLORS.danger : COLORS.warning }]}>{over ? 'Terlambat' : 'Segera'}</Text>
                      <Text style={styles.deadlineDate}>{formatDateTime(task.deadline)}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.bg },
  content:         { padding: 20 },
  topBar:          { backgroundColor: COLORS.primary, padding: 24, paddingTop: 60, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: -20, marginTop: -20, marginBottom: 24, ...SHADOW.md },
  greeting:        { fontSize: 24, ...FONT.bold, color: '#FFFFFF' },
  subtitle:        { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  avatar:          { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  headerTitle:     { fontSize: 20, ...FONT.bold, color: '#FFF' },
  avatarText:      { fontSize: 20, ...FONT.bold, color: '#FFFFFF' },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard:        { width: '48%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm },
  statValue:       { fontSize: 20, ...FONT.bold, marginTop: 4 },
  statLabel:       { fontSize: 12, color: COLORS.textMuted, marginTop: 2, ...FONT.medium },
  progressWrap:    { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight },
  progressBarBg:   { height: 10, borderRadius: 5, backgroundColor: COLORS.borderLight, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: 10, backgroundColor: COLORS.success, borderRadius: 5 },
  progressText:    { fontSize: 13, color: COLORS.textMuted, marginTop: 4, ...FONT.medium },
  insightBox:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  insightText:     { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  section:         { marginTop: 24 },
  sectionTitle:    { fontSize: 16, ...FONT.bold, color: COLORS.text, marginBottom: 12 },
  alertBox:        { backgroundColor: COLORS.warningLight, borderWidth: 1, borderColor: '#FDE68A', borderRadius: RADIUS.lg, padding: 16 },
  alertTitle:      { fontSize: 14, ...FONT.bold, color: COLORS.warning, marginBottom: 12 },
  alertItem:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  alertDot:        { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  alertText:       { fontSize: 12, flex: 1, ...FONT.medium },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAllBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  seeAll:          { fontSize: 12, color: COLORS.primary, ...FONT.bold },
  skeleton:        { height: 72, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.lg, marginBottom: 10 },
  taskCard:        { marginBottom: 10, padding: 14 },
  taskRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskDot:         { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  taskInfo:        { flex: 1 },
  taskTitle:       { fontSize: 14, ...FONT.semibold, color: COLORS.text },
  taskMeta:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  taskCat:         { fontSize: 11, ...FONT.medium },
  taskBadge:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: '#fee2e2' },
  taskBadgeText:   { fontSize: 10, ...FONT.bold, color: '#dc2626' },
  deadlineCard:    { marginBottom: 10, padding: 14 },
  overdueCard:     { borderColor: '#fca5a5', backgroundColor: '#fff9f9' },
  deadlineRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  urgentDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  deadlineInfo:    { flex: 1 },
  deadlineTitle:   { fontSize: 14, ...FONT.semibold, color: COLORS.text },
  deadlineCat:     { fontSize: 12, ...FONT.medium, marginTop: 2 },
  deadlineDateWrap:{ alignItems: 'flex-end' },
  deadlineUrgency: { fontSize: 11, ...FONT.bold },
  deadlineDate:    { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
