import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from './ui';
import { COLORS, FONT, SHADOW } from '../utils/theme';

const STATUSES = ['SEDANG_DIKERJAKAN', 'SELESAI', 'TERLEWAT'];
const PRIORITIES = ['RENDAH', 'NORMAL', 'TINGGI'];
const PRIORITY_LBL = { RENDAH: 'Rendah', NORMAL: 'Normal', TINGGI: 'Tinggi' };

const SORT_OPTIONS = [
  { key: 'createdAt-desc', label: 'Terbaru',       icon: 'schedule',      sort: 'createdAt', order: 'desc' },
  { key: 'deadline-asc',   label: 'Deadline',      icon: 'event',         sort: 'deadline',  order: 'asc' },
  { key: 'priority-desc',  label: 'Prioritas',     icon: 'priority-high', sort: 'priority',  order: 'desc' },
  { key: 'title-asc',      label: 'Judul A-Z',     icon: 'sort-by-alpha', sort: 'title',     order: 'asc' },
];

export default function FilterSheet({ visible, filters, sortKey, onSortChange, categories, onApply, onClose, onReset, statusConfig, priorityConfig }) {
  const [local, setLocal] = useState(filters);
  const [localSort, setLocalSort] = useState(sortKey);
  
  const set = (k, v) => setLocal(f => ({ ...f, [k]: f[k] === v ? '' : v }));

  useEffect(() => {
    if (visible) {
      setLocal(filters);
      setLocalSort(sortKey);
    }
  }, [visible, filters, sortKey]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent={true}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity style={fStyle.overlay} activeOpacity={1} onPress={onClose} />
        <View style={fStyle.sheet}>
          <View style={fStyle.handle} />
          <View style={fStyle.header}>
            <Text style={fStyle.title}>Filter & Urutkan</Text>
            <TouchableOpacity onPress={() => {
              setLocal({ status: '', priority: '', categoryId: '' });
              setLocalSort('createdAt-desc');
              if (onReset) onReset();
            }}>
              <Text style={fStyle.reset}>Reset Semua</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
            <Text style={fStyle.secLabel}>Urutkan Berdasarkan</Text>
            <View style={fStyle.chipRow}>
              {SORT_OPTIONS.map(opt => {
                const active = localSort === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setLocalSort(opt.key)}
                    style={[fStyle.chip, active && fStyle.chipActive]}
                  >
                    <MaterialIcons 
                      name={opt.icon} 
                      size={16} 
                      color={active ? '#000000' : '#64748B'} 
                    />
                    <Text style={[fStyle.chipText, active && fStyle.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyle.secLabel}>Status</Text>
            <View style={fStyle.chipRow}>
              {STATUSES.map(s => {
                const cfg = statusConfig[s] || statusConfig['SEDANG_DIKERJAKAN'];
                const active = local.status === s;
                return (
                  <TouchableOpacity 
                    key={s} 
                    onPress={() => set('status', s)}
                    style={[
                      fStyle.chip, 
                      active && { backgroundColor: cfg.bg, borderColor: cfg.dot, borderWidth: 2 }
                    ]}
                  >
                    {active && <MaterialIcons name="check-circle" size={16} color={cfg.text} />}
                    <Text style={[fStyle.chipText, active && { color: cfg.text, ...FONT.bold }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyle.secLabel}>Prioritas</Text>
            <View style={fStyle.chipRow}>
              {PRIORITIES.map(p => {
                const cfg = priorityConfig[p];
                const active = local.priority === p;
                return (
                  <TouchableOpacity 
                    key={p} 
                    onPress={() => set('priority', p)}
                    style={[
                      fStyle.chip, 
                      active && { backgroundColor: cfg.bg, borderColor: cfg.border || cfg.text, borderWidth: 2 }
                    ]}
                  >
                    {active && <MaterialIcons name="check-circle" size={16} color={cfg.text} />}
                    <Text style={[fStyle.chipText, active && { color: cfg.text, ...FONT.bold }]}>{PRIORITY_LBL[p]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={fStyle.secLabel}>Kategori</Text>
            <View style={fStyle.chipRow}>
              {categories.map(c => {
                const active = local.categoryId === String(c.id);
                return (
                  <TouchableOpacity key={c.id} onPress={() => set('categoryId', String(c.id))}
                    style={[fStyle.chip, active && fStyle.chipActive, active && { borderColor: c.color }]}>
                    <View style={[fStyle.catDot, { backgroundColor: c.color }]} />
                    <Text style={[fStyle.chipText, active && { color: c.color, ...FONT.bold }]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={fStyle.footer}>
            <Button title="Terapkan" onPress={() => { onApply(local); onSortChange(localSort); onClose(); }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const fStyle = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 24, marginTop: -8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, ...FONT.bold, color: '#0F172A' },
  reset: { fontSize: 13, color: '#94A3B8', ...FONT.bold },
  secLabel: { fontSize: 13, ...FONT.bold, color: '#475569', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    backgroundColor: '#F8FAFC', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
  },
  chipActive: { 
    backgroundColor: '#FACC15', 
    borderColor: '#FACC15', 
    elevation: 3,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chipText: { fontSize: 14, ...FONT.bold, color: '#475569', textAlign: 'center' },
  chipTextActive: { color: '#000000', ...FONT.bold },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  footer: { marginTop: 8 },
});
