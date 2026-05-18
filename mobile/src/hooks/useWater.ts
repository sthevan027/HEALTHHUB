import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { writeCache, readCache } from '../services/storage';
import { syncWaterMilestones } from '../utils/waterMilestones';
import { WATER_GOAL_ML } from '../constants/goals';

export interface WaterEntry {
  id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export interface WaterData {
  entries: WaterEntry[];
  total_ml: number;
  goal_ml: number;
}

export function useWater() {
  const [data, setData] = useState<WaterData>({ entries: [], total_ml: 0, goal_ml: WATER_GOAL_ML });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = (dateStr: string) => `water_${dateStr}`;

  const fetchWater = useCallback(async (date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<WaterData>(`/water?date=${dateStr}`);
      setData(res.data);
      await writeCache(cacheKey(dateStr), res.data);
    } catch (err) {
      const cached = await readCache<WaterData>(cacheKey(dateStr));
      if (cached) setData(cached);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addWater = useCallback(async (amount_ml: number, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.post('/water', { amount_ml, date: dateStr });
      const res = await api.get<WaterData>(`/water?date=${dateStr}`);
      setData(res.data);
      await writeCache(cacheKey(dateStr), res.data);
      await syncWaterMilestones(dateStr, res.data.total_ml);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  const deleteWater = useCallback(async (id: string, date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    try {
      await api.delete(`/water/${id}`);
      const res = await api.get<WaterData>(`/water?date=${dateStr}`);
      setData(res.data);
      await writeCache(cacheKey(dateStr), res.data);
      await syncWaterMilestones(dateStr, res.data.total_ml);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  return { data, loading, error, fetchWater, addWater, deleteWater };
}
