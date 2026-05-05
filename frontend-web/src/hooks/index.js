// Custom hooks - Tasks & Categories

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI, categoryAPI } from '../api';
import toast from 'react-hot-toast';

// ─── Task Hooks ───────────────────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => taskAPI.getDashboard().then(r => r.data.data),
  });

export const useTasks = (filters = {}) =>
  useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskAPI.getAll(filters).then(r => r.data.data),
  });

export const useTask = (id) =>
  useQuery({
    queryKey: ['task', id],
    queryFn: () => taskAPI.getById(id).then(r => r.data.data),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => taskAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tugas berhasil ditambahkan!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambahkan tugas'),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => taskAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tugas berhasil diperbarui!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui tugas'),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => taskAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tugas dihapus.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus tugas'),
  });
};

// ─── Subtask Hooks ────────────────────────────────────────────────────────
export const useCreateSubtask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) => taskAPI.createSubtask(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambahkan sub-tugas'),
  });
};

export const useToggleSubtask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }) => taskAPI.toggleSubtask(taskId, subtaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah status sub-tugas'),
  });
};

export const useDeleteSubtask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId }) => taskAPI.deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus sub-tugas'),
  });
};

// ─── Category Hooks ───────────────────────────────────────────────────────

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll().then(r => r.data.data),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => categoryAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori ditambahkan!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambahkan kategori'),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => categoryAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori diperbarui!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui kategori'),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => categoryAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori dihapus.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus kategori'),
  });
};
