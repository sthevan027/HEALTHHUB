import { useState, useCallback } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { writeCache, readCache } from '../services/storage';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  date: string;
  meal_type: MealType;
  name: string;
  calories?: number;
  description?: string;
  created_at: string;
}

export interface CreateMealInput {
  name: string;
  meal_type: MealType;
  calories?: number;
  description?: string;
}

export type UpdateMealInput = Partial<CreateMealInput>;

export interface MealsWeekData {
  start: string;
  end: string;
  mealsByDate: Record<string, Meal[]>;
}

export function weekStart(date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 0, locale: ptBR }), 'yyyy-MM-dd');
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weekData, setWeekData] = useState<MealsWeekData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = (dateStr: string) => `meals_${dateStr}`;
  const weekCacheKey = (start: string) => `meals_week_${start}`;

  const fetchMeals = useCallback(async (date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ meals: Meal[] }>(`/meals?date=${dateStr}`);
      setMeals(res.data.meals);
      await writeCache(cacheKey(dateStr), res.data.meals);
    } catch (err) {
      const cached = await readCache<Meal[]>(cacheKey(dateStr));
      if (cached) setMeals(cached);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMealsWeek = useCallback(async (start?: string) => {
    const startStr = start || weekStart();
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<MealsWeekData>(`/meals/week?start=${startStr}`);
      setWeekData(res.data);
      await writeCache(weekCacheKey(startStr), res.data);
    } catch (err) {
      const cached = await readCache<MealsWeekData>(weekCacheKey(startStr));
      if (cached) setWeekData(cached);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMeal = useCallback(async (input: CreateMealInput, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.post('/meals', { ...input, date: dateStr });
      await fetchMeals(dateStr);
      const ws = weekStart(new Date(`${dateStr}T12:00:00`));
      await fetchMealsWeek(ws);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchMeals, fetchMealsWeek]);

  const updateMeal = useCallback(async (id: string, input: UpdateMealInput, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.put(`/meals/${id}`, input);
      await fetchMeals(dateStr);
      const ws = weekStart(new Date(`${dateStr}T12:00:00`));
      await fetchMealsWeek(ws);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchMeals, fetchMealsWeek]);

  const deleteMeal = useCallback(async (id: string, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.delete(`/meals/${id}`);
      await fetchMeals(dateStr);
      const ws = weekStart(new Date(`${dateStr}T12:00:00`));
      await fetchMealsWeek(ws);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, [fetchMeals, fetchMealsWeek]);

  const getWeekDays = useCallback((start: string) => {
    return Array.from({ length: 7 }, (_, i) => format(addDays(new Date(`${start}T12:00:00`), i), 'yyyy-MM-dd'));
  }, []);

  return {
    meals,
    weekData,
    loading,
    error,
    fetchMeals,
    fetchMealsWeek,
    addMeal,
    updateMeal,
    deleteMeal,
    getWeekDays,
    weekStart,
  };
}
