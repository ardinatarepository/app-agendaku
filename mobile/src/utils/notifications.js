// Notification Service - Deadline reminders lokal
// Kompatibel dengan Expo SDK 54 + Expo Go

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, parseISO } from 'date-fns';
import { formatDateTime } from './helpers';

// Setup handler - dibungkus try-catch untuk Expo Go
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (err) {
  // Abaikan error di Expo Go
}

import { Alert, Platform } from 'react-native';

export const requestNotificationPermission = async () => {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Izin Notifikasi Diperlukan',
        'AgendaKu membutuhkan izin notifikasi agar pengingat tugas bisa muncul. Silakan aktifkan melalui Pengaturan sistem jika Anda tidak melihat pop-up izin.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const scheduleTaskNotification = async (task) => {
  if (!task.deadline || task.status === 'SELESAI') return;

  try {
    // Pastikan izin notifikasi sudah diberikan
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const deadlineRaw = task.deadline;
    const deadlineDate = typeof deadlineRaw === 'string' ? parseISO(deadlineRaw) : new Date(deadlineRaw);
    const taskId = String(task.id);
    const nowTs = Date.now();

    await cancelTaskNotification(task.id);

    const enabled = await AsyncStorage.getItem('notif_enabled');
    if (enabled === 'false') return;

    const hN = parseInt(await AsyncStorage.getItem('notif_hari') || '1');
    const jam = parseInt(await AsyncStorage.getItem('notif_jam') || '08');

    let triggerDate = subDays(deadlineDate, hN);
    triggerDate.setHours(jam, 0, 0, 0);

    const triggerTs = triggerDate.getTime();
    if (triggerTs > nowTs) {
      const secondsFromNow = Math.max(1, Math.floor((triggerTs - nowTs) / 1000));

      await Notifications.scheduleNotificationAsync({
        identifier: `task-${taskId}-rem`,
        content: {
          title: 'Pengingat Tugas',
          body: `${task.title} - Jatuh tempo pada ${formatDateTime(deadlineRaw)}`,
          color: '#1e293b', // Professional dark color
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { taskId },
        },
        trigger: {
          type: 'timeInterval',
          seconds: secondsFromNow,
          repeats: false,
        },
      });
    }
  } catch (err) {
    // Abaikan - notifikasi lokal mungkin tidak didukung penuh di Expo Go
  }
};

export const cancelTaskNotification = async (taskId) => {
  const id = String(taskId);
  const keys = [`task-${id}-confirm`, `task-${id}-notif`, `task-${id}-hn`, `task-${id}-h0`, `task-${id}-rem`, `task-${id}-d1`];
  for (const key of keys) {
    try {
      await Notifications.cancelScheduledNotificationAsync(key);
    } catch (e) {}
  }
};

export const sendTestNotification = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Notifikasi Uji Berhasil!",
        body: "Koneksi notifikasi aktif. Anda akan menerima pengingat tugas sesuai jadwal.",
      },
      trigger: {
        type: 'timeInterval',
        seconds: 2,
        repeats: false,
      },
    });
    return true;
  } catch (err) {
    return false;
  }
};

export const rescheduleAllNotifications = async (tasks) => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const granted = await requestNotificationPermission();
    if (!granted) return;

    for (const task of tasks) {
      if (task.status !== 'SELESAI' && task.deadline) {
        await scheduleTaskNotification(task);
      }
    }
  } catch (e) {}
};
