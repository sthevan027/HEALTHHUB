import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { writeCache, readCache } from '../services/storage';

export interface Workout {
  id: string;
  date: string;
  exercise: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
  completed: boolean;
  created_at: string;
}

export interface CreateWorkoutInput {
  exercise: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
}

export interface MonthStat {
  date: string;
  count: number;
  completed_count: number;
}

export function useWorkout() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workoutCacheKey = (dateStr: string) => `workouts_${dateStr}`;

  const fetchWorkouts = useCallback(async (date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ workouts: Workout[] }>(`/workouts?date=${dateStr}`);
      setWorkouts(res.data.workouts);
      await writeCache(workoutCacheKey(dateStr), res.data.workouts);
    } catch (err) {
      const cached = await readCache<Workout[]>(workoutCacheKey(dateStr));
      if (cached) setWorkouts(cached);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthStats = useCallback(async (year: number, month: number) => {
    try {
      const res = await api.get<{ monthStats: MonthStat[] }>(
        `/workouts/month?year=${year}&month=${month}`
      );
      const normalized = res.data.monthStats.map((s) => ({
        ...s,
        date: typeof s.date === 'string' ? s.date.slice(0, 10) : String(s.date).slice(0, 10),
        count: Number(s.count),
        completed_count: Number(s.completed_count),
      }));
      setMonthStats(normalized);
    } catch {
      // non-critical
    }
  }, []);

  const refreshMonthForDate = useCallback(async (dateStr: string) => {
    const d = new Date(`${dateStr}T12:00:00`);
    await fetchMonthStats(d.getFullYear(), d.getMonth() + 1);
  }, [fetchMonthStats]);

  const addWorkout = useCallback(async (input: CreateWorkoutInput, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.post('/workouts', { ...input, date: dateStr });
      await fetchWorkouts(dateStr);
      await refreshMonthForDate(dateStr);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchWorkouts, refreshMonthForDate]);

  const toggleComplete = useCallback(async (id: string, completed: boolean, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.put(`/workouts/${id}`, { completed });
      await fetchWorkouts(dateStr);
      await refreshMonthForDate(dateStr);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchWorkouts, refreshMonthForDate]);

  const deleteWorkout = useCallback(async (id: string, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.delete(`/workouts/${id}`);
      await fetchWorkouts(dateStr);
      await refreshMonthForDate(dateStr);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchWorkouts, refreshMonthForDate]);

  return {
    workouts,
    monthStats,
    loading,
    error,
    fetchWorkouts,
    fetchMonthStats,
    addWorkout,
    toggleComplete,
    deleteWorkout,
  };
}
