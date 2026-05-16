import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../hooks/useWorkout';

interface Props {
  workout: Workout;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export default function WorkoutItem({ workout, onToggle, onDelete }: Props) {
  return (
    <View style={[styles.item, workout.completed && styles.completed]}>
      <TouchableOpacity
        onPress={() => onToggle(workout.id, !workout.completed)}
        style={styles.checkbox}
      >
        <Ionicons
          name={workout.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={workout.completed ? '#27ae60' : '#bdc3c7'}
        />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.exercise, workout.completed && styles.completedText]}>
          {workout.exercise}
        </Text>
        <View style={styles.meta}>
          {workout.sets && workout.reps && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{workout.sets}x{workout.reps}</Text>
            </View>
          )}
          {workout.weight_kg && (
            <View style={[styles.badge, styles.weightBadge]}>
              <Text style={styles.badgeText}>{workout.weight_kg}kg</Text>
            </View>
          )}
          {workout.duration_minutes && (
            <View style={[styles.badge, styles.timeBadge]}>
              <Text style={styles.badgeText}>{workout.duration_minutes}min</Text>
            </View>
          )}
        </View>
        {workout.notes && (
          <Text style={styles.notes}>{workout.notes}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => onDelete(workout.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  completed: { opacity: 0.65, borderLeftColor: '#27ae60' },
  checkbox: { marginRight: 12, paddingTop: 2 },
  content: { flex: 1 },
  exercise: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  completedText: { textDecorationLine: 'line-through', color: '#7f8c8d' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
  badge: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  weightBadge: { backgroundColor: '#8e44ad' },
  timeBadge: { backgroundColor: '#3498db' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  notes: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  deleteBtn: { padding: 4 },
});
