import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../hooks/useMeals';

const MEAL_CONFIG = {
  breakfast: { label: 'Café da manhã', emoji: '🥞', color: '#f39c12' },
  lunch: { label: 'Almoço', emoji: '🍲', color: '#e74c3c' },
  dinner: { label: 'Jantar', emoji: '🍱', color: '#8e44ad' },
  snack: { label: 'Lanche', emoji: '🍎', color: '#27ae60' },
};

interface Props {
  meal: Meal;
  onPress?: (meal: Meal) => void;
  onDelete: (id: string) => void;
}

function MealCard({ meal, onPress, onDelete }: Props) {
  const config = MEAL_CONFIG[meal.meal_type];

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={() => onPress?.(meal)}
      style={[styles.card, { borderLeftColor: config.color }]}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{meal.name}</Text>
          <Text style={[styles.type, { color: config.color }]}>{config.label}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(meal.id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      {(meal.calories || meal.description) && (
        <View style={styles.details}>
          {meal.calories != null && (
            <Text style={styles.calories}>{meal.calories} kcal</Text>
          )}
          {meal.description && (
            <Text style={styles.description}>{meal.description}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(MealCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  type: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  deleteBtn: { padding: 4 },
  details: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  calories: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },
  description: { fontSize: 13, color: '#7f8c8d', marginTop: 2 },
});
