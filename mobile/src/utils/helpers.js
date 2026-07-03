// Utility helpers - Mobile

import { 
  format, formatDistanceToNow, isPast, isWithinInterval, 
  addDays, isToday, isTomorrow, isAfter, startOfDay 
} from 'date-fns';

// Ekspor utilitas dasar agar konsisten di seluruh aplikasi
export { isToday, isTomorrow, isAfter };
import { id as localeId } from 'date-fns/locale';

// ... (formatDate, formatDateTime, formatRelative, isOverdue, isNearDeadline, getDeadlineColor remain the same)

export const groupTasksByDate = (tasks) => {
  const sections = [
    { title: 'Terlewat', data: [], icon: 'error' },
    { title: 'Hari Ini', data: [], icon: 'today' },
    { title: 'Besok', data: [], icon: 'event' },
    { title: 'Mendatang', data: [], icon: 'upcoming' },
    { title: 'Selesai (Lampau)', data: [], icon: 'check-circle' },
    { title: 'Tanpa Deadline', data: [], icon: 'help-outline' },
  ];

  const finishedSections = {};

  tasks.forEach(task => {
    // Tugas SELESAI: kelompokkan berdasarkan tanggal dibuat
    if (task.status === 'SELESAI') {
      const dateKey = formatDate(task.createdAt);
      if (!finishedSections[dateKey]) {
        finishedSections[dateKey] = { title: `Selesai: ${dateKey}`, data: [], icon: 'check-circle' };
      }
      finishedSections[dateKey].data.push(task);
      return;
    }

    // Tugas TERLEWAT: selalu masuk ke section Terlewat
    if (task.status === 'TERLEWAT') {
      sections[0].data.push(task);
      return;
    }

    if (!task.deadline) {
      sections[5].data.push(task);
      return;
    }

    const d = new Date(task.deadline);
    const today = startOfDay(new Date());

    if (isToday(d)) {
      sections[1].data.push(task);
    } else if (isTomorrow(d)) {
      sections[2].data.push(task);
    } else if (isPast(d)) {
      // Deadline sudah lewat tapi status belum TERLEWAT: masuk Terlewat juga
      sections[0].data.push(task);
    } else if (isAfter(d, today)) {
      sections[3].data.push(task);
    }
  });

  const activeSections = sections.filter(section => section.data.length > 0);
  const finishedList = Object.values(finishedSections);

  return [...activeSections, ...finishedList];
};

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'd MMM yyyy', { locale: localeId });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: localeId });
};

export const formatRelative = (date) => {
  if (!date) return null;
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeId });
};

export const isOverdue = (date) => {
  if (!date) return false;
  return isPast(new Date(date));
};

export const isNearDeadline = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 3) });
};

// Warna deadline dinamis - Brighter palette
export const getDeadlineColor = (date, status) => {
  if (!date || status === 'SELESAI') return '#94a3b8';
  if (isOverdue(date)) return '#FF4444'; // Brighter Red
  if (isNearDeadline(date)) return '#FBBF24'; // Brighter Yellow/Amber
  return '#6366F1'; // Bright Indigo for normal
};
