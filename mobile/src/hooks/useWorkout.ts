import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { storage } from '../services/storage';

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

  const fetchWorkouts = useCallback(async (date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ workouts: Workout[] }>(`/workouts?date=${dateStr}`);
      setWorkouts(res.data.workouts);
      await storage.set(`workouts_${dateStr}`, res.data.workouts);
    } catch (err) {
      const cached = await storage.get<Workout[]>(`workouts_${dateStr}`);
      if (cached) setWorkouts(cached);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthStats = useCallback(async (year: number, month: number) => {
    try {
      const res = await api.get<{ monthStats: MonthStat[] }>(`/workouts/month?year=${year}&month=${month}`);
      setMonthStats(res.data.monthStats);
    } catch {
      // month stats failure is non-critical
    }
  }, []);

  const addWorkout = useCallback(async (input: CreateWorkoutInput, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.post('/workouts', { ...input, date: dateStr });
      const res = await api.get<{ workouts: Workout[] }>(`/workouts?date=${dateStr}`);
      setWorkouts(res.data.workouts);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const toggleComplete = useCallback(async (id: string, completed: boolean, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.put(`/workouts/${id}`, { completed });
      const res = await api.get<{ workouts: Workout[] }>(`/workouts?date=${dateStr}`);
      setWorkouts(res.data.workouts);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const deleteWorkout = useCallback(async (id: string, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.delete(`/workouts/${id}`);
      const res = await api.get<{ workouts: Workout[] }>(`/workouts?date=${dateStr}`);
      setWorkouts(res.data.workouts);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  return { workouts, monthStats, loading, error, fetchWorkouts, fetchMonthStats, addWorkout, toggleComplete, deleteWorkout };
}
