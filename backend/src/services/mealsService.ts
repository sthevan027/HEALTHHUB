import { query } from '../database/db';
import { CreateMealInput, UpdateMealInput } from '../models/Meal';
import { addDays } from '../utils/validation';

export async function getMealsByDate(date: string) {
  const result = await query(
    'SELECT * FROM meals WHERE date = $1 ORDER BY created_at ASC',
    [date]
  );
  return result.rows;
}

export async function getMealsWeek(start: string) {
  const end = addDays(start, 6);
  const result = await query(
    'SELECT * FROM meals WHERE date >= $1 AND date <= $2 ORDER BY date ASC, created_at ASC',
    [start, end]
  );
  const byDate: Record<string, typeof result.rows> = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    byDate[d] = [];
  }
  for (const meal of result.rows) {
    const key = typeof meal.date === 'string'
      ? meal.date.slice(0, 10)
      : new Date(meal.date).toISOString().slice(0, 10);
    if (byDate[key]) byDate[key].push(meal);
  }
  return { start, end, mealsByDate: byDate };
}

export async function createMeal(input: CreateMealInput) {
  const { date, meal_type, name, calories, description } = input;
  const result = await query(
    'INSERT INTO meals (date, meal_type, name, calories, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [date, meal_type, name, calories ?? null, description ?? null]
  );
  return result.rows[0];
}

export async function updateMeal(id: string, updates: UpdateMealInput) {
  const allowed: (keyof UpdateMealInput)[] = ['meal_type', 'name', 'calories', 'description'];
  const fields = allowed.filter((f) => updates[f] !== undefined);
  if (fields.length === 0) return null;
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = [...fields.map((f) => updates[f]), id];
  const result = await query(
    `UPDATE meals SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
    values
  );
  if ((result.rowCount ?? 0) === 0) return null;
  return result.rows[0];
}

export async function deleteMeal(id: string) {
  const result = await query('DELETE FROM meals WHERE id = $1 RETURNING id', [id]);
  return result.rowCount ?? 0;
}
