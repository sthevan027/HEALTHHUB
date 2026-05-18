import { query } from '../database/db';
import { CreateWorkoutInput, UpdateWorkoutInput } from '../models/Workout';

export async function getWorkoutsByDate(date: string) {
  const result = await query(
    'SELECT * FROM workouts WHERE date = $1 ORDER BY created_at ASC',
    [date]
  );
  return result.rows;
}

export async function getMonthStats(year: number, month: number) {
  const result = await query(
    `SELECT date::text, COUNT(*)::int as count,
            SUM(CASE WHEN completed THEN 1 ELSE 0 END)::int as completed_count
     FROM workouts
     WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
     GROUP BY date`,
    [year, month]
  );
  return result.rows;
}

export async function createWorkout(input: CreateWorkoutInput) {
  const { date, exercise, sets, reps, weight_kg, duration_minutes, notes } = input;
  const result = await query(
    'INSERT INTO workouts (date, exercise, sets, reps, weight_kg, duration_minutes, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [date, exercise, sets ?? null, reps ?? null, weight_kg ?? null, duration_minutes ?? null, notes ?? null]
  );
  return result.rows[0];
}

export async function updateWorkout(id: string, updates: UpdateWorkoutInput) {
  const allowed: (keyof UpdateWorkoutInput)[] = [
    'exercise', 'sets', 'reps', 'weight_kg', 'duration_minutes', 'notes', 'completed',
  ];
  const fields = allowed.filter((f) => updates[f] !== undefined);
  if (fields.length === 0) return null;
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map((f) => updates[f]), id];
  const result = await query(
    `UPDATE workouts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
    values
  );
  if ((result.rowCount ?? 0) === 0) return null;
  return result.rows[0];
}

export async function deleteWorkout(id: string) {
  const result = await query('DELETE FROM workouts WHERE id = $1 RETURNING id', [id]);
  return result.rowCount ?? 0;
}
