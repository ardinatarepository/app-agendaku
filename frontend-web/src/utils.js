// Utility helpers - Frontend Web

import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'd MMM yyyy', { locale: localeId });
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
  SEDANG_DIKERJAKAN: { label: 'Sedang Dikerjakan', cls: 'badge-dikerjakan', dot: 'bg-blue-500' },
  SELESAI:           { label: 'Selesai',           cls: 'badge-selesai',    dot: 'bg-emerald-500' },
  TERLEWAT:          { label: 'Terlewat',          cls: 'badge-terlewat',   dot: 'bg-red-500' },
};

export const PRIORITY_CONFIG = {
  RENDAH: { label: 'Rendah', cls: 'badge-rendah' },
  NORMAL: { label: 'Normal', cls: 'badge-normal' },
  TINGGI: { label: 'Tinggi', cls: 'badge-tinggi' },
};
