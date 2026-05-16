// Utility helpers - Frontend Web

import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'd MMM yyyy', { locale: localeId });
  } catch (e) {
    console.error("Invalid date:", date);
    return '-';
  }
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
  return isWithinInterval(new Date(date), { start: new Date(), end: addDays(new Date(), 3) });
};

export const STATUS_CONFIG = {
  SEDANG_DIKERJAKAN: { label: 'Sedang Berjalan', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  SELESAI:           { label: 'Selesai',         bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  TERLEWAT:          { label: 'Terlewat',        bg: '#FEF2F2', text: '#DC2626', dot: '#F87171' },
};

export const PRIORITY_CONFIG = {
  RENDAH: { label: 'Rendah', symbol: 'R', bg: '#F1F5F9', text: '#64748B' },
  NORMAL: { label: 'Normal', symbol: 'N', bg: '#FEF3C7', text: '#F59E0B' },
  TINGGI: { label: 'Tinggi', symbol: 'T', bg: '#FEE2E2', text: '#EF4444' },
};
