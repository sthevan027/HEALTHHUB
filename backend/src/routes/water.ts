import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../database/db';
import { WaterIntake, CreateWaterInput } from '../models/Water';

const router = Router();

const createWaterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount_ml: z.number().int().positive().max(5000),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date as string;
    if (!date) {
      res.status(400).json({ error: 'date query param required' });
      return;
    }
    const result = await query(
      'SELECT * FROM water_intake WHERE date = $1 ORDER BY created_at ASC',
      [date]
    );
    const totalMl = result.rows.reduce((sum: number, r: WaterIntake) => sum + r.amount_ml, 0);
    res.json({ entries: result.rows, total_ml: totalMl, goal_ml: 2000 });
  } catch (err) {
    next(err);
  }
});

router.get('/stats/week', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT date, SUM(amount_ml) as total_ml
       FROM water_intake
       WHERE date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY date
       ORDER BY date ASC`
    );
    res.json({ stats: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createWaterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { date, amount_ml } = parsed.data as CreateWaterInput;
    const result = await query(
      'INSERT INTO water_intake (date, amount_ml) VALUES ($1, $2) RETURNING *',
      [date, amount_ml]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM water_intake WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    res.json({ deleted: true, id });
  } catch (err) {
    next(err);
  }
});

export default router;
