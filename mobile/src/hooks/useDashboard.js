import { useState, useCallback, useEffect, useRef } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isToday } from 'date-fns';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { setTabBarVisible, resetTabBarVisible } from '../utils/tabBarControl';
import { rescheduleAllNotifications } from '../utils/notifications';
import { isOverdue, isNearDeadline } from '../utils/helpers';

export const useDashboard = (navigation) => {
  const qc = useQueryClient();
  const { user, lastAvatar } = useAuth();
  
  // Data Fetching
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

  // Derived Data - Pastikan logika sama dengan TaskListScreen
  const stats = data?.stats || {};

  // Tugas Terlewat - Gunakan data dari dashboard API (sudah benar dari server)
  const tugasTerlewat = data?.tugasTerlewat || [];

  // Mendekati Deadline (Hanya yang belum SELESAI dan dalam rentang 3 hari)
  const tugasDeadline = allTasks.filter(t => t.status !== 'SELESAI' && t.deadline && !isOverdue(t.deadline) && isNearDeadline(t.deadline));

  // Agenda Hari Ini (Hanya yang belum SELESAI, jatuh tempo hari ini)
  const tugasHariIni = allTasks.filter(t => 
    t.status !== 'SELESAI' && 
    t.deadline && 
    isToday(new Date(t.deadline))
  );

  // Tugas yang Akan Datang (Hanya yang belum SELESAI/TERLEWAT, deadline besok atau seterusnya)
  const todayVal = new Date(); todayVal.setHours(0, 0, 0, 0);
  const tomorrowVal = new Date(todayVal); tomorrowVal.setDate(tomorrowVal.getDate() + 1);
  const tugasAkanDatang = allTasks.filter(t => 
    t.status !== 'SELESAI' && 
    t.status !== 'TERLEWAT' &&
    t.deadline && 
    new Date(t.deadline).getTime() >= tomorrowVal.getTime()
  ).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Filter logic untuk statistik Minggu Ini
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const tugasMingguIni = allTasks.filter(t => {
    if (!t.deadline) return false;
    const dl = new Date(t.deadline);
    return dl >= startOfWeek && dl <= endOfWeek;
  });

  // Navigation helpers
  const goToTasks = (filter = {}) => navigation.navigate('Tugas', { initialFilter: filter });

  // Scroll logic
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
    }, [])
  );

  return {
    user,
    lastAvatar,
    stats,
    tugasDeadline,
    tugasTerlewat,
    tugasMingguIni,
    tugasHariIni,
    tugasAkanDatang,
    isLoading,
    refreshing,
    handleRefresh,
    handleScroll,
    goToTasks
  };
};
