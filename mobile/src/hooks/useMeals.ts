import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { storage } from '../services/storage';

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

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async (date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ meals: Meal[] }>(`/meals?date=${dateStr}`);
      setMeals(res.data.meals);
      await storage.set(`meals_${dateStr}`, res.data.meals);
    } catch (err) {
      const cached = await storage.get<Meal[]>(`meals_${dateStr}`);
      if (cached) setMeals(cached);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMeal = useCallback(async (input: CreateMealInput, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.post('/meals', { ...input, date: dateStr });
      const res = await api.get<{ meals: Meal[] }>(`/meals?date=${dateStr}`);
      setMeals(res.data.meals);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const deleteMeal = useCallback(async (id: string, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.delete(`/meals/${id}`);
      const res = await api.get<{ meals: Meal[] }>(`/meals?date=${dateStr}`);
      setMeals(res.data.meals);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  return { meals, loading, error, fetchMeals, addMeal, deleteMeal };
}
