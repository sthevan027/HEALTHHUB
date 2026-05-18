import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, addDays, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import {
  useMeals, MealType, CreateMealInput, Meal, weekStart,
} from '../hooks/useMeals';
import MealCard from '../components/MealCard';
import { CALORIE_GOAL } from '../constants/goals';

const MEAL_TYPES: { type: MealType; label: string; emoji: string; color: string }[] = [
  { type: 'breakfast', label: 'Café da manhã', emoji: '🥞', color: '#f39c12' },
  { type: 'lunch', label: 'Almoço', emoji: '🍲', color: '#e74c3c' },
  { type: 'dinner', label: 'Jantar', emoji: '🍱', color: '#8e44ad' },
  { type: 'snack', label: 'Lanche', emoji: '🍎', color: '#27ae60' },
];

type ViewMode = 'day' | 'week';

const emptyForm = (): CreateMealInput => ({
  name: '',
  meal_type: 'breakfast',
  calories: undefined,
  description: '',
});

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const {
    meals, weekData, loading, fetchMeals, fetchMealsWeek,
    addMeal, updateMeal, deleteMeal, getWeekDays,
  } = useMeals();

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [weekStartDate, setWeekStartDate] = useState(weekStart());
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<CreateMealInput>(emptyForm());
  const [modalDate, setModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const today = format(new Date(), 'yyyy-MM-dd');
  const displayMeals = viewMode === 'day'
    ? meals
    : (weekData?.mealsByDate[selectedDay] ?? []);

  const totalCalories = displayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

  useEffect(() => {
    if (viewMode === 'day') {
      fetchMeals(today);
    } else {
      fetchMealsWeek(weekStartDate);
      fetchMeals(selectedDay);
    }
  }, [viewMode, today, weekStartDate, selectedDay, fetchMeals, fetchMealsWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === 'day') {
      await fetchMeals(today);
    } else {
      await fetchMealsWeek(weekStartDate);
      await fetchMeals(selectedDay);
    }
    setRefreshing(false);
  }, [viewMode, today, weekStartDate, selectedDay, fetchMeals, fetchMealsWeek]);

  const openAddModal = (date: string) => {
    setEditingId(null);
    setModalDate(date);
    setForm(emptyForm());
    setModalVisible(true);
  };

  const openEditModal = (meal: Meal) => {
    setEditingId(meal.id);
    setModalDate(typeof meal.date === 'string' ? meal.date.slice(0, 10) : today);
    setForm({
      name: meal.name,
      meal_type: meal.meal_type,
      calories: meal.calories,
      description: meal.description ?? '',
    });
    setModalVisible(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome da refeição');
      return;
    }
    try {
      if (editingId) {
        await updateMeal(editingId, form, modalDate);
      } else {
        await addMeal(form, modalDate);
      }
      setModalVisible(false);
      setForm(emptyForm());
      setEditingId(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a refeição');
    }
  }, [form, editingId, modalDate, addMeal, updateMeal]);

  const handleDelete = useCallback((id: string) => {
    const date = viewMode === 'day' ? today : selectedDay;
    Alert.alert('Remover refeição', 'Deseja remover esta refeição?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => deleteMeal(id, date),
      },
    ]);
  }, [deleteMeal, viewMode, today, selectedDay]);

  const weekDays = getWeekDays(weekStartDate);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🍽️ Refeições</Text>
            <Text style={styles.date}>
              {viewMode === 'day'
                ? format(new Date(), "d 'de' MMMM", { locale: ptBR })
                : `Semana de ${format(new Date(`${weekStartDate}T12:00:00`), "d MMM", { locale: ptBR })}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => openAddModal(viewMode === 'day' ? today : selectedDay)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'day' && styles.segmentActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.segmentText, viewMode === 'day' && styles.segmentTextActive]}>Dia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'week' && styles.segmentActive]}
            onPress={() => {
              setViewMode('week');
              setWeekStartDate(weekStart());
              setSelectedDay(today);
            }}
          >
            <Text style={[styles.segmentText, viewMode === 'week' && styles.segmentTextActive]}>Semana</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'week' && (
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => setWeekStartDate(format(subWeeks(new Date(`${weekStartDate}T12:00:00`), 1), 'yyyy-MM-dd'))}>
              <Ionicons name="chevron-back" size={24} color="#e74c3c" />
            </TouchableOpacity>
            <Text style={styles.weekNavTitle}>
              {format(new Date(`${weekStartDate}T12:00:00`), "d MMM", { locale: ptBR })} –{' '}
              {format(addDays(new Date(`${weekStartDate}T12:00:00`), 6), "d MMM yyyy", { locale: ptBR })}
            </Text>
            <TouchableOpacity onPress={() => setWeekStartDate(format(addWeeks(new Date(`${weekStartDate}T12:00:00`), 1), 'yyyy-MM-dd'))}>
              <Ionicons name="chevron-forward" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}

        {viewMode === 'week' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDaysScroll}>
            {weekDays.map((day) => {
              const dayMeals = weekData?.mealsByDate[day] ?? [];
              const kcal = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
              const isSelected = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.weekDayCard, isSelected && styles.weekDaySelected]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.weekDayName, isSelected && styles.weekDayTextSelected]}>
                    {format(new Date(`${day}T12:00:00`), 'EEE', { locale: ptBR })}
                  </Text>
                  <Text style={[styles.weekDayNum, isSelected && styles.weekDayTextSelected]}>
                    {format(new Date(`${day}T12:00:00`), 'd')}
                  </Text>
                  <Text style={[styles.weekDayKcal, isSelected && styles.weekDayTextSelected]}>{kcal} kcal</Text>
                  <Text style={[styles.weekDayCount, isSelected && styles.weekDayTextSelected]}>
                    {dayMeals.length} ref.
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: '#e74c3c' }]}>
            <Text style={styles.statNum}>{displayMeals.length}</Text>
            <Text style={styles.statLabel}>Refeições</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#f39c12' }]}>
            <Text style={styles.statNum}>{totalCalories}</Text>
            <Text style={styles.statLabel}>kcal totais</Text>
          </View>
          <View style={[styles.statBox, { borderLeftColor: '#27ae60' }]}>
            <Text style={styles.statNum}>
              {CALORIE_GOAL - totalCalories > 0 ? CALORIE_GOAL - totalCalories : 0}
            </Text>
            <Text style={styles.statLabel}>kcal restantes</Text>
          </View>
        </View>

        <View style={styles.typeSummary}>
          {MEAL_TYPES.map(({ type, emoji, color }) => {
            const count = displayMeals.filter((m) => m.meal_type === type).length;
            return (
              <View key={type} style={[styles.typeChip, { borderColor: color, opacity: count > 0 ? 1 : 0.4 }]}>
                <Text style={styles.typeEmoji}>{emoji}</Text>
                <Text style={[styles.typeCount, { color }]}>{count}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.list}>
          {displayMeals.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>Nenhuma refeição registrada</Text>
              <Text style={styles.emptyHint}>Toque em + para adicionar</Text>
            </View>
          ) : (
            displayMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onPress={openEditModal}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editingId ? 'Editar Refeição' : 'Nova Refeição'}</Text>
            <Text style={styles.modalDateLabel}>
              {format(new Date(`${modalDate}T12:00:00`), "d 'de' MMMM", { locale: ptBR })}
            </Text>

            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Frango grelhado com arroz"
              value={form.name}
              onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
            />

            <Text style={styles.fieldLabel}>Categoria</Text>
            <View style={styles.typeRow}>
              {MEAL_TYPES.map(({ type, label, emoji, color }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    form.meal_type === type && { backgroundColor: color, borderColor: color },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, meal_type: type }))}
                >
                  <Text style={styles.typeOptionEmoji}>{emoji}</Text>
                  <Text style={[styles.typeOptionLabel, form.meal_type === type && { color: '#fff' }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Calorias (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 450"
              keyboardType="numeric"
              value={form.calories?.toString() || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, calories: t ? parseInt(t, 10) : undefined }))}
            />

            <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalhes sobre a refeição..."
              multiline
              numberOfLines={3}
              value={form.description || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setModalVisible(false); setEditingId(null); }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]}
                onPress={handleSave}
              >
                <Text style={styles.confirmText}>{editingId ? 'Salvar' : 'Adicionar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50' },
  date: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  addBtn: { backgroundColor: '#e74c3c', borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ecf0f1', borderRadius: 10, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontWeight: '600', color: '#7f8c8d' },
  segmentTextActive: { color: '#e74c3c' },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  weekNavTitle: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  weekDaysScroll: { paddingHorizontal: 12, marginBottom: 12 },
  weekDayCard: {
    width: 72,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekDaySelected: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  weekDayName: { fontSize: 11, color: '#7f8c8d', textTransform: 'capitalize' },
  weekDayNum: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
  weekDayKcal: { fontSize: 10, color: '#7f8c8d', marginTop: 4 },
  weekDayCount: { fontSize: 9, color: '#95a5a6' },
  weekDayTextSelected: { color: '#fff' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  statNum: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  statLabel: { fontSize: 11, color: '#7f8c8d', marginTop: 2 },
  typeSummary: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, paddingVertical: 8, borderWidth: 2,
  },
  typeEmoji: { fontSize: 18 },
  typeCount: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  list: { paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#bdc3c7', marginTop: 12, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#bdc3c7', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  modalDateLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#7f8c8d', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#dfe6e9', borderRadius: 10, padding: 12, fontSize: 15, color: '#2c3e50', backgroundColor: '#fdfdfd' },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeRow: { gap: 8 },
  typeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#dfe6e9', borderRadius: 10, padding: 10,
    backgroundColor: '#fdfdfd',
  },
  typeOptionEmoji: { fontSize: 20 },
  typeOptionLabel: { fontSize: 14, fontWeight: '500', color: '#2c3e50' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#ecf0f1' },
  cancelText: { color: '#7f8c8d', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
