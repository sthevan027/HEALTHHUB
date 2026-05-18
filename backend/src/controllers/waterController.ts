import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as waterService from '../services/waterService';
import { dateSchema, parseDateQuery } from '../utils/validation';
import { CreateWaterInput } from '../models/Water';

const createWaterSchema = z.object({
  date: dateSchema,
  amount_ml: z.number().int().positive().max(5000),
});

export async function getByDate(req: Request, res: Response, next: NextFunction) {
  try {
    const date = parseDateQuery(req.query.date);
    if (!date) {
      res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
      return;
    }
    const data = await waterService.getWaterByDate(date);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getWeekStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await waterService.getWeekStats();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createWaterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { date, amount_ml } = parsed.data as CreateWaterInput;
    const entry = await waterService.createWater(date, amount_ml);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await waterService.deleteWater(req.params.id);
    if (deleted === 0) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}
