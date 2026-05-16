import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useMeals, MealType, CreateMealInput } from '../hooks/useMeals';
import MealCard from '../components/MealCard';

const MEAL_TYPES: { type: MealType; label: string; emoji: string; color: string }[] = [
  { type: 'breakfast', label: 'Café da manhã', emoji: '🥞', color: '#f39c12' },
  { type: 'lunch', label: 'Almoço', emoji: '🍲', color: '#e74c3c' },
  { type: 'dinner', label: 'Jantar', emoji: '🍱', color: '#8e44ad' },
  { type: 'snack', label: 'Lanche', emoji: '🍎', color: '#27ae60' },
];

const CALORIE_GOAL = 2000;

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const { meals, loading, fetchMeals, addMeal, deleteMeal } = useMeals();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState<CreateMealInput>({
    name: '',
    meal_type: 'breakfast',
    calories: undefined,
    description: '',
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "d 'de' MMMM", { locale: ptBR });
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);

  useEffect(() => { fetchMeals(today); }, [fetchMeals, today]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMeals(today);
    setRefreshing(false);
  }, [fetchMeals, today]);

  const handleAdd = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome da refeição');
      return;
    }
    try {
      await addMeal(form, today);
      setModalVisible(false);
      setForm({ name: '', meal_type: 'breakfast', calories: undefined, description: '' });
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar a refeição');
    }
  }, [form, addMeal, today]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Remover refeição', 'Deseja remover esta refeição?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteMeal(id, today) },
    ]);
  }, [deleteMeal, today]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🍽️ Refeições</Text>
          <Text style={styles.date}>{todayLabel}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: '#e74c3c' }]}>
          <Text style={styles.statNum}>{meals.length}</Text>
          <Text style={styles.statLabel}>Refeições</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#f39c12' }]}>
          <Text style={styles.statNum}>{totalCalories}</Text>
          <Text style={styles.statLabel}>kcal totais</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#27ae60' }]}>
          <Text style={styles.statNum}>{CALORIE_GOAL - totalCalories > 0 ? CALORIE_GOAL - totalCalories : 0}</Text>
          <Text style={styles.statLabel}>kcal restantes</Text>
        </View>
      </View>

      {/* Type Summary */}
      <View style={styles.typeSummary}>
        {MEAL_TYPES.map(({ type, label, emoji, color }) => {
          const count = meals.filter((m) => m.meal_type === type).length;
          return (
            <View key={type} style={[styles.typeChip, { borderColor: color, opacity: count > 0 ? 1 : 0.4 }]}>
              <Text style={styles.typeEmoji}>{emoji}</Text>
              <Text style={[styles.typeCount, { color }]}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* Meal List */}
      <View style={styles.list}>
        {meals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyText}>Nenhuma refeição registrada</Text>
            <Text style={styles.emptyHint}>Toque em + para adicionar</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
          ))
        )}
      </View>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Nova Refeição</Text>

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
                onPress={() => { setModalVisible(false); }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]}
                onPress={handleAdd}
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
  addBtn: { backgroundColor: '#e74c3c', borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
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
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#bdc3c7', marginTop: 12, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: '#bdc3c7', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2c3e50', marginBottom: 20 },
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
