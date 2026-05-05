// Notification Service - Deadline reminders lokal
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subDays, startOfHour, isFuture, parseISO } from 'date-fns';
import { formatDate, formatDateTime } from './helpers';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export const requestNotificationPermission = async () => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleTaskNotification = async (task, isImmediate = false) => {
  if (!task.deadline || task.status === 'SELESAI') return;

  try {
    const deadlineRaw = task.deadline;
    const deadlineDate = typeof deadlineRaw === 'string' ? parseISO(deadlineRaw) : new Date(deadlineRaw);
    const taskId   = String(task.id);
    const nowTs    = Date.now();

    // Batalkan notifikasi lama
    await cancelTaskNotification(task.id);

    if (isImmediate) {
      await Notifications.scheduleNotificationAsync({
        identifier: `task-${taskId}-confirm`,
        content: {
          title: '𝗞𝗼𝗻𝗳𝗶𝗿𝗺𝗮𝘀𝗶 𝗧𝘂𝗴𝗮𝘀', // Bold unicode
          body:  `Tugas "${task.title}" berhasil ditambahkan. Deadline: ${formatDateTime(deadlineRaw)}`,
          data:  { taskId },
        },
        trigger: null, // Kirim instan tanpa delay
      });
    }

    // Ambil preferensi user
    const enabled = await AsyncStorage.getItem('notif_enabled');
    if (enabled === 'false') return;

    const hN  = parseInt(await AsyncStorage.getItem('notif_hari') || '1');
    const jam = parseInt(await AsyncStorage.getItem('notif_jam') || '08');

    // 2. NOTIFIKASI TERJADWAL (H-n)
    let triggerDate = subDays(deadlineDate, hN);
    triggerDate.setHours(jam, 0, 0, 0);

    const triggerTs = triggerDate.getTime();
    if (triggerTs > nowTs) {
      const title = '𝗣𝗲𝗻𝗴𝗶𝗻𝗴𝗮𝘁 𝗧𝘂𝗴𝗮𝘀';
      const body  = `Tugas "${task.title}" harus selesai sebelum ${formatDateTime(deadlineRaw)}`;

      await Notifications.scheduleNotificationAsync({
        identifier: `task-${taskId}-rem`,
        content: { title, body, data: { taskId } },
        trigger: { date: triggerTs },
      });
    }
  } catch (err) {
    console.error('Error notification:', err);
  }
};

export const cancelTaskNotification = async (taskId) => {
  const id = String(taskId);
  const keys = [`task-${id}-confirm`, `task-${id}-notif`, `task-${id}-hn`, `task-${id}-h0`, `task-${id}-rem`, `task-${id}-d1` ];
  for (const key of keys) {
    try {
      await Notifications.cancelScheduledNotificationAsync(key);
    } catch (e) {}
  }
};

export const sendTestNotification = async () => {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "𝗡𝗼𝘁𝗶𝗳𝗶𝗸𝗮𝘀𝗶 𝗨𝗷𝗶 𝗕𝗲𝗿𝗵𝗮𝘀𝗶𝗹!",
      body: "Koneksi notifikasi aktif. Anda akan menerima pengingat tugas sesuai jadwal.",
    },
    trigger: { seconds: 2 },
  });
  return true;
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
