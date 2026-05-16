import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout, CreateWorkoutInput } from '../hooks/useWorkout';
import WorkoutItem from '../components/WorkoutItem';

const ORANGE = '#f39c12';

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { workouts, monthStats, loading, fetchWorkouts, fetchMonthStats, addWorkout, toggleComplete, deleteWorkout } = useWorkout();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<CreateWorkoutInput>({
    exercise: '',
    sets: undefined,
    reps: undefined,
    weight_kg: undefined,
    duration_minutes: undefined,
    notes: '',
  });

  const selectedStr = format(selectedDate, 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(selectedDate, "d 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    fetchWorkouts(selectedStr);
  }, [fetchWorkouts, selectedStr]);

  useEffect(() => {
    fetchMonthStats(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }, [fetchMonthStats, currentMonth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkouts(selectedStr);
    setRefreshing(false);
  }, [fetchWorkouts, selectedStr]);

  const handleAddWorkout = useCallback(async () => {
    if (!form.exercise.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do exercício');
      return;
    }
    try {
      await addWorkout(form, selectedStr);
      setModalVisible(false);
      setForm({ exercise: '', sets: undefined, reps: undefined, weight_kg: undefined, duration_minutes: undefined, notes: '' });
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o treino');
    }
  }, [form, addWorkout, selectedStr]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Remover treino', 'Deseja remover este treino?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteWorkout(id, selectedStr) },
    ]);
  }, [deleteWorkout, selectedStr]);

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getDay(startOfMonth(currentMonth)); // 0=Sun
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getMonthStatForDay = (day: number) => {
    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
    return monthStats.find((s) => s.date === dateStr);
  };

  const completedToday = workouts.filter((w) => w.completed).length;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🏋️ Treinos</Text>
          <Text style={styles.date}>{todayLabel}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: ORANGE }]}>
          <Text style={styles.statNum}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Treinos hoje</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#27ae60' }]}>
          <Text style={styles.statNum}>{completedToday}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#3498db' }]}>
          <Text style={styles.statNum}>{monthStats.reduce((s, d) => s + Number(d.count), 0)}</Text>
          <Text style={styles.statLabel}>No mês</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <Ionicons name="chevron-back" size={24} color={ORANGE} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <Ionicons name="chevron-forward" size={24} color={ORANGE} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayStr = format(new Date(year, month, day), 'yyyy-MM-dd');
            const isSelected = dayStr === selectedStr;
            const isToday = dayStr === today;
            const stat = getMonthStatForDay(day);
            const hasWorkouts = stat && Number(stat.count) > 0;

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDay,
                  isToday && !isSelected && styles.todayDay,
                ]}
                onPress={() => setSelectedDate(new Date(year, month, day))}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.selectedDayText,
                  isToday && !isSelected && { color: ORANGE, fontWeight: '700' },
                ]}>
                  {day}
                </Text>
                {hasWorkouts && (
                  <View style={[styles.workoutDot, isSelected && { backgroundColor: '#fff' }]}>
                    <Text style={[styles.dotCount, isSelected && { color: ORANGE }]}>
                      {stat?.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Workout List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>
          Treinos de {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </Text>
        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>Nenhum treino neste dia</Text>
            <Text style={styles.emptyHint}>Toque em + para adicionar</Text>
          </View>
        ) : (
          workouts.map((w) => (
            <WorkoutItem
              key={w.id}
              workout={w}
              onToggle={toggleComplete}
              onDelete={handleDelete}
            />
          ))
        )}
      </View>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Novo Treino</Text>
            <Text style={styles.modalDate}>
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </Text>

            <Text style={styles.fieldLabel}>Exercício *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Supino reto, Agachamento..."
              value={form.exercise}
              onChangeText={(t) => setForm((p) => ({ ...p, exercise: t }))}
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Séries</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  keyboardType="numeric"
                  value={form.sets?.toString() || ''}
                  onChangeText={(t) => setForm((p) => ({ ...p, sets: t ? parseInt(t, 10) : undefined }))}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  keyboardType="numeric"
                  value={form.reps?.toString() || ''}
                  onChangeText={(t) => setForm((p) => ({ ...p, reps: t ? parseInt(t, 10) : undefined }))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="60"
                  keyboardType="decimal-pad"
                  value={form.weight_kg?.toString() || ''}
                  onChangeText={(t) => setForm((p) => ({ ...p, weight_kg: t ? parseFloat(t) : undefined }))}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Duração (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="45"
                  keyboardType="numeric"
                  value={form.duration_minutes?.toString() || ''}
                  onChangeText={(t) => setForm((p) => ({ ...p, duration_minutes: t ? parseInt(t, 10) : undefined }))}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observações sobre o treino..."
              multiline
              numberOfLines={3}
              value={form.notes || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, notes: t }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: ORANGE }]}
                onPress={handleAddWorkout}
              >
                <Text style={styles.confirmText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50' },
  date: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  addBtn: { backgroundColor: ORANGE, borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  calendarCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', textTransform: 'capitalize' },
  weekDaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, color: '#7f8c8d', fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  selectedDay: { backgroundColor: ORANGE, borderRadius: 20 },
  todayDay: { borderWidth: 2, borderColor: ORANGE, borderRadius: 20 },
  dayText: { fontSize: 14, color: '#2c3e50', fontWeight: '500' },
  selectedDayText: { color: '#fff', fontWeight: '700' },
  workoutDot: {
    position: 'absolute', bottom: 4, backgroundColor: ORANGE,
    borderRadius: 6, paddingHorizontal: 4, minWidth: 14, alignItems: 'center',
  },
  dotCount: { fontSize: 9, color: '#fff', fontWeight: '700' },
  listSection: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#bdc3c7', marginTop: 12, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#bdc3c7', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '92%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  modalDate: { fontSize: 13, color: '#7f8c8d', marginTop: 4, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#dfe6e9', borderRadius: 10, padding: 12, fontSize: 15, color: '#2c3e50', backgroundColor: '#fdfdfd' },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#ecf0f1' },
  cancelText: { color: '#7f8c8d', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
