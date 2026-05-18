import { query } from '../database/db';
import { WATER_GOAL_ML } from '../constants/goals';
import { WaterIntake } from '../models/Water';

export async function getWaterByDate(date: string) {
  const result = await query(
    'SELECT * FROM water_intake WHERE date = $1 ORDER BY created_at ASC',
    [date]
  );
  const totalMl = result.rows.reduce((sum: number, r: WaterIntake) => sum + r.amount_ml, 0);
  return { entries: result.rows, total_ml: totalMl, goal_ml: WATER_GOAL_ML };
}

export async function getWeekStats() {
  const result = await query(
    `SELECT date::text, SUM(amount_ml)::int as total_ml
     FROM water_intake
     WHERE date >= CURRENT_DATE - INTERVAL '6 days'
     GROUP BY date
     ORDER BY date ASC`
  );
  return result.rows;
}

export async function createWater(date: string, amount_ml: number) {
  const result = await query(
    'INSERT INTO water_intake (date, amount_ml) VALUES ($1, $2) RETURNING *',
    [date, amount_ml]
  );
  return result.rows[0];
}

export async function deleteWater(id: string) {
  const result = await query('DELETE FROM water_intake WHERE id = $1 RETURNING id', [id]);
  return result.rowCount ?? 0;
}
