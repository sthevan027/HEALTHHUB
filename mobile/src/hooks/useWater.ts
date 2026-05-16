import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { storage } from '../services/storage';
import { scheduleWaterNotification } from '../services/notifications';

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

const GOAL_ML = 2000;
const notifiedMilestones = new Set<number>();

export function useWater() {
  const [data, setData] = useState<WaterData>({ entries: [], total_ml: 0, goal_ml: GOAL_ML });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWater = useCallback(async (date?: string) => {
    const dateStr = date || format(new Date(), 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<WaterData>(`/water?date=${dateStr}`);
      setData(res.data);
      await storage.set(`water_${dateStr}`, res.data);
    } catch (err) {
      const cached = await storage.get<WaterData>(`water_${dateStr}`);
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
      await storage.set(`water_${dateStr}`, res.data);

      const pct = Math.round((res.data.total_ml / GOAL_ML) * 100);
      for (const milestone of [50, 75, 100]) {
        if (pct >= milestone && !notifiedMilestones.has(milestone)) {
          notifiedMilestones.add(milestone);
          await scheduleWaterNotification(milestone);
        }
      }
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
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  return { data, loading, error, fetchWater, addWater, deleteWater };
}
