import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONT, SHADOW } from '../../../utils/theme';
import { AVATAR_URL } from '../../../config';
import { Skeleton } from '../../../components/ui';
import { format } from 'date-fns';
import { formatDateTime } from '../../../utils/helpers';

const { width } = Dimensions.get('window');

// ─── Header ──────────────────────────────────────────────────────────────────
export const DashboardHeader = ({ user, lastAvatar, onProfilePress }) => (
  <View style={styles.topBar}>
    <View>
      <Text style={styles.greetingLabel}>SELAMAT DATANG</Text>
      <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0] || 'User'}</Text>
    </View>
    <TouchableOpacity 
      style={styles.avatarBox} 
      onPress={onProfilePress}
      activeOpacity={0.7}
    >
      {lastAvatar ? (
        <Image source={{ uri: `${AVATAR_URL}/${lastAvatar}` }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

// ─── Statistics ──────────────────────────────────────────────────────────────
export const DashboardStats = ({ stats, tugasMingguIniCount, isLoading, onStatPress }) => {
  if (isLoading) {
    return (
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: '#FFFFFF', elevation: 0, borderWidth: 1, borderColor: '#F1F5F9' }]}>
            <View style={styles.statIconFloating}>
              <Skeleton width={20} height={20} borderRadius={10} />
            </View>
            <Skeleton width="40%" height={28} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={12} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  const items = [
    { label: 'BERJALAN', value: stats.sedangDikerjakan || 0, icon: 'play-outline', bg: '#000000', text: '#FACC15', labelColor: '#FACC15', iconColor: '#FACC15', filter: { status: 'SEDANG_DIKERJAKAN' } },
    { label: 'SELESAI', value: stats.selesai || 0, icon: 'checkmark-circle-outline', bg: '#FFFFFF', text: '#000000', labelColor: '#000000', iconColor: '#000000', filter: { status: 'SELESAI' } },
    { label: 'TERLEWAT', value: stats.terlewat || 0, icon: 'time-outline', bg: '#FFFFFF', text: COLORS.danger, labelColor: COLORS.danger, iconColor: COLORS.danger, filter: { status: 'TERLEWAT' } },
    { label: 'TOTAL', value: stats.total || 0, icon: 'list-outline', bg: '#FACC15', text: '#000000', labelColor: '#000000', iconColor: '#000000', filter: {} },
  ];

  return (
    <View style={styles.statsGrid}>
      {items.map((item, idx) => (
        <TouchableOpacity 
          key={idx} 
          style={[styles.statCard, { backgroundColor: item.bg }]} 
          onPress={() => onStatPress(item.filter)}
          activeOpacity={0.7}
        >
          <View style={styles.statIconFloating}>
            <Ionicons name={item.icon} size={20} color={item.iconColor} />
          </View>
          <Text style={[styles.statValue, { color: item.text }]}>{item.value}</Text>
          <Text style={[styles.statLabel, { color: item.labelColor }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Sections (Tasks) ────────────────────────────────────────────────────────
export const DashboardSections = ({ tugasTerlewat, tugasDeadline, tugasHariIni, onTaskPress, onSectionPress, isLoading }) => {
  if (isLoading) {
    return (
      <View style={{ gap: 20, paddingBottom: 10 }}>
        {[1, 2].map(i => (
          <View key={i} style={styles.dashboardSection}>
            <View style={styles.sectionHead}>
              <Skeleton width={120} height={20} borderRadius={4} />
            </View>
            <View style={styles.sectionBody}>
              {[1, 2].map(j => (
                <View key={j} style={styles.itemRow}>
                   <Skeleton width="100%" height={40} borderRadius={12} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 20, paddingBottom: 10 }}>
      {tugasTerlewat.length > 0 && (
        <View style={styles.dashboardSection}>
          <TouchableOpacity style={styles.sectionHead} onPress={() => onSectionPress({ status: 'TERLEWAT' })}>
            <Text style={styles.sectionTitle}>Tugas Terlewat</Text>
            <Ionicons name="chevron-forward" size={18} color="#000000" />
          </TouchableOpacity>
          <View style={styles.sectionBody}>
            {tugasTerlewat.slice(0, 3).map((item, index, arr) => (
              <TouchableOpacity key={item.id} style={[styles.itemRow, { backgroundColor: '#FEF2F2' }, index === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={() => onTaskPress(item.id, item.status)}>
                <View style={styles.overdueBar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.itemMeta}>
                    <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                    <Text style={styles.itemDate}>{formatDateTime(item.deadline)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.dashboardSection}>
        <TouchableOpacity style={styles.sectionHead} onPress={() => onSectionPress({ status: 'SEDANG_DIKERJAKAN' })}>
          <Text style={styles.sectionTitle}>Mendekati Deadline</Text>
          <Ionicons name="chevron-forward" size={18} color="#000000" />
        </TouchableOpacity>
        <View style={styles.sectionBody}>
          {tugasDeadline.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyText}>Tidak ada deadline mendesak.</Text></View>
          ) : (
            tugasDeadline.slice(0, 3).map((item, index, arr) => (
              <TouchableOpacity key={item.id} style={[styles.itemRow, index === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={() => onTaskPress(item.id, item.status)}>
                <View style={styles.yellowDot} />
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.rightContent}>
                  <View style={styles.segeraBadge}><Text style={styles.segeraText}>Segera</Text></View>
                  <Text style={styles.timeText}>{format(new Date(item.deadline), 'HH:mm')}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.dashboardSection}>
        <TouchableOpacity style={styles.sectionHead} onPress={() => onSectionPress({ status: 'SEDANG_DIKERJAKAN' })}>
          <Text style={styles.sectionTitle}>Agenda Hari Ini</Text>
          <Ionicons name="chevron-forward" size={18} color="#000000" />
        </TouchableOpacity>
        <View style={styles.sectionBody}>
          {tugasHariIni.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyText}>Tidak ada agenda untuk hari ini.</Text></View>
          ) : (
            tugasHariIni.slice(0, 3).map((item, index, arr) => (
              <TouchableOpacity key={item.id} style={[styles.itemRow, index === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={() => onTaskPress(item.id, item.status)}>
                <View style={styles.yellowDot} />
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.rightContent}>
                  <Text style={styles.todayText}>Hari ini</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </View>
  );
};

// ─── Progress ────────────────────────────────────────────────────────────────
export const DashboardProgress = ({ stats, isLoading }) => {
  const total = stats.total || 0;
  const selesai = stats.selesai || 0;
  const percent = total > 0 ? Math.round((selesai / total) * 100) : 0;

  const activeColor = '#FACC15'; // Original Brand Yellow

  const steps = [
    { id: 1, label: 'BAGUS', threshold: 25 },
    { id: 2, label: 'KEREN', threshold: 50 },
    { id: 3, label: 'RAJIN', threshold: 100 },
  ];

  const getLatestCompletedId = (p) => {
    if (p >= 100) return 3;
    if (p >= 50) return 2;
    if (p >= 25) return 1;
    return null;
  };

  const latestCompletedId = getLatestCompletedId(percent);

  if (isLoading) {
    return (
      <View style={styles.dashboardSection}>
        <View style={styles.sectionHead}>
          <Skeleton width={150} height={20} borderRadius={4} />
        </View>
        <View style={[styles.sectionBody, { padding: 40, alignItems: 'center' }]}>
          <Skeleton width="80%" height={10} borderRadius={5} />
          <View style={{ height: 20 }} />
          <Skeleton width="60%" height={10} borderRadius={5} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dashboardSection}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Progres Belajar</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{selesai}/{total}</Text></View>
      </View>
      
      <View style={[styles.sectionBody, { paddingHorizontal: 30, paddingTop: 75, paddingBottom: 35, alignItems: 'center' }]}>
        <View style={styles.milestoneWrapper}>
          {/* Background Line */}
          <View style={styles.milestoneLineBg} />
          {/* Active Progress Line */}
          <View style={[styles.milestoneLineActive, { width: `${percent}%`, backgroundColor: activeColor }]} />

          {/* Nodes */}
          {steps.map((step) => {
            const isCompleted = percent >= step.threshold;
            const showTooltip = latestCompletedId === step.id;

            return (
              <View key={step.id} style={[styles.milestoneNodeWrapper, { left: `${step.threshold}%` }]}>
                {showTooltip && (
                  <View style={styles.tooltipContainer}>
                    <View style={[styles.tooltipBox, { backgroundColor: '#0F172A' }]}>
                      <Text style={styles.tooltipText}>{step.label}</Text>
                    </View>
                    <View style={[styles.tooltipArrow, { borderTopColor: '#0F172A' }]} />
                  </View>
                )}
                
                <View style={[
                  styles.milestoneNode,
                  isCompleted ? { backgroundColor: activeColor, borderColor: activeColor } : (latestCompletedId === null && step.id === 1) ? { borderColor: activeColor } : styles.nodeFuture
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#000000" />
                  ) : (latestCompletedId === null && step.id === 1) ? (
                    <View style={[styles.nodeDotActive, { backgroundColor: activeColor }]} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 30, width: '100%', alignItems: 'center' }}>
          <Text style={styles.progressSubText}>{percent}% selesai — {total - selesai} tugas tersisa</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar:          { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 50, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    zIndex: 10,
  },
  greetingLabel:   { fontSize: 11, ...FONT.medium, color: '#94A3B8', letterSpacing: 1.2 },
  greeting:        { fontSize: 32, ...FONT.heading, color: '#000000', marginTop: 2, letterSpacing: -1.5 },
  avatarBox:       { width: 60, height: 60, backgroundColor: '#FACC15', borderRadius: 18, overflow: 'hidden' },
  avatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:   { fontSize: 24, ...FONT.bold, color: '#000000' },
  avatarImage:     { width: '100%', height: '100%' },
  
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 16 },
  statCard:        { width: '48%', height: 88, borderRadius: 18, paddingHorizontal: 18, marginBottom: 15, ...SHADOW.sm, elevation: 3, position: 'relative', justifyContent: 'center' },
  statIconFloating: { position: 'absolute', top: 12, right: 12 },
  statValue:       { fontSize: 30, ...FONT.heading, lineHeight: 36 },
  statLabel:       { fontSize: 11, ...FONT.heading, color: '#64748B', letterSpacing: 1.5, marginTop: 2 },

  dashboardSection: { backgroundColor: '#FFFFFF', borderRadius: 18, width: '100%', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, overflow: 'hidden' },
  sectionHead:     { paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:    { fontSize: 17, ...FONT.bold, color: '#000000', letterSpacing: -0.5 },
  sectionBody:     { paddingVertical: 0 },
  itemRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  overdueBar:      { width: 4, height: 36, backgroundColor: '#EF4444', borderRadius: 2, marginRight: 14 },
  yellowDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FACC15', marginRight: 14 },
  itemTitle:       { flex: 1, fontSize: 15, ...FONT.semibold, color: '#0F172A' },
  itemMeta:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemDate:        { fontSize: 13, color: '#64748B', ...FONT.medium },
  rightContent:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segeraBadge:     { backgroundColor: '#FACC15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  countText:       { fontSize: 12, ...FONT.bold, color: '#64748B', includeFontPadding: false, textAlignVertical: 'center' },
  segeraText:      { fontSize: 11, ...FONT.bold, color: '#000000' },
  timeText:        { fontSize: 14, color: '#64748B', ...FONT.bold, minWidth: 45, textAlign: 'right' },
  todayText:       { fontSize: 14, color: '#EF4444', ...FONT.bold },
  
  milestoneWrapper: { width: '85%', height: 4, position: 'relative', justifyContent: 'center' },
  milestoneLineBg:  { position: 'absolute', width: '100%', height: 4, backgroundColor: '#F1F5F9', borderRadius: 2 },
  milestoneLineActive: { position: 'absolute', height: 4, backgroundColor: '#FACC15', borderRadius: 2 },
  
  milestoneNodeWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 40, marginLeft: -20 },
  milestoneNode: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', ...SHADOW.sm, padding: 0 },
  
  nodeCompleted: { backgroundColor: '#FACC15', borderColor: '#FACC15' },
  nodeTarget:    { borderColor: '#FACC15' },
  nodeFuture:    { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  
  nodeDotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FACC15' },
  
  tooltipContainer: { position: 'absolute', bottom: 42, alignItems: 'center', zIndex: 10, width: 120 },
  tooltipBox: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tooltipText: { color: '#FFFFFF', fontSize: 10, ...FONT.bold, letterSpacing: 0.5 },
  tooltipArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#0F172A', marginTop: -1 },
  
  progressSubText: { fontSize: 13, color: '#64748B', ...FONT.medium },
  emptyState:      { padding: 40, alignItems: 'center' },
  emptyText:       { fontSize: 14, color: '#94A3B8', ...FONT.medium },
});
