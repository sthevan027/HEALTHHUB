import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../database/db';
import { CreateMealInput, UpdateMealInput } from '../models/Meal';

const router = Router();

const mealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

const createMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: mealTypeEnum,
  name: z.string().min(1).max(255),
  calories: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

const updateMealSchema = z.object({
  meal_type: mealTypeEnum.optional(),
  name: z.string().min(1).max(255).optional(),
  calories: z.number().int().positive().optional(),
  description: z.string().max(1000).optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string;
    if (!date) {
      res.status(400).json({ error: 'date query param required' });
      return;
    }
    const result = await query(
      'SELECT * FROM meals WHERE date = $1 ORDER BY created_at ASC',
      [date]
    );
    res.json({ meals: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createMealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { date, meal_type, name, calories, description } = parsed.data as CreateMealInput;
    const result = await query(
      'INSERT INTO meals (date, meal_type, name, calories, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date, meal_type, name, calories ?? null, description ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateMealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const updates = parsed.data as UpdateMealInput;
    const fields = Object.keys(updates) as (keyof UpdateMealInput)[];
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = [...fields.map((f) => updates[f]), req.params.id];
    const result = await query(
      `UPDATE meals SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('DELETE FROM meals WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
