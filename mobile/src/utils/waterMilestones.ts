import { storage } from '../services/storage';
import { scheduleWaterNotification } from '../services/notifications';
import { WATER_GOAL_ML, WATER_MILESTONES } from '../constants/goals';

function milestonesKey(dateStr: string) {
  return `water_milestones_${dateStr}`;
}

export async function syncWaterMilestones(dateStr: string, totalMl: number): Promise<void> {
  const pct = Math.round((totalMl / WATER_GOAL_ML) * 100);
  const stored = (await storage.get<number[]>(milestonesKey(dateStr))) ?? [];
  const notified = new Set(stored);

  for (const milestone of WATER_MILESTONES) {
    if (pct >= milestone && !notified.has(milestone)) {
      notified.add(milestone);
      await scheduleWaterNotification(milestone);
    }
    if (pct < milestone && notified.has(milestone)) {
      notified.delete(milestone);
    }
  }

  await storage.set(milestonesKey(dateStr), Array.from(notified));
}
