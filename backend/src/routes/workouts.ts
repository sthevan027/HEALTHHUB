import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../database/db';
import { CreateWorkoutInput, UpdateWorkoutInput } from '../models/Workout';

const router = Router();

const createWorkoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  exercise: z.string().min(1).max(255),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weight_kg: z.number().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const updateWorkoutSchema = z.object({
  exercise: z.string().min(1).max(255).optional(),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weight_kg: z.number().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string;
    if (!date) {
      res.status(400).json({ error: 'date query param required' });
      return;
    }
    const result = await query(
      'SELECT * FROM workouts WHERE date = $1 ORDER BY created_at ASC',
      [date]
    );
    res.json({ workouts: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/month', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      res.status(400).json({ error: 'year and month query params required' });
      return;
    }
    const result = await query(
      `SELECT date, COUNT(*) as count, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_count
       FROM workouts
       WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
       GROUP BY date`,
      [year, month]
    );
    res.json({ monthStats: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { date, exercise, sets, reps, weight_kg, duration_minutes, notes } = parsed.data as CreateWorkoutInput;
    const result = await query(
      'INSERT INTO workouts (date, exercise, sets, reps, weight_kg, duration_minutes, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [date, exercise, sets ?? null, reps ?? null, weight_kg ?? null, duration_minutes ?? null, notes ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const updates = parsed.data as UpdateWorkoutInput;
    const fields = Object.keys(updates) as (keyof UpdateWorkoutInput)[];
    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = [...fields.map((f) => updates[f]), req.params.id];
    const result = await query(
      `UPDATE workouts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('DELETE FROM workouts WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
