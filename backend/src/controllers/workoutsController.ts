import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as workoutsService from '../services/workoutsService';
import { dateSchema, parseDateQuery } from '../utils/validation';
import { CreateWorkoutInput, UpdateWorkoutInput } from '../models/Workout';

const createWorkoutSchema = z.object({
  date: dateSchema,
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

export async function getByDate(req: Request, res: Response, next: NextFunction) {
  try {
    const date = parseDateQuery(req.query.date);
    if (!date) {
      res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
      return;
    }
    const workouts = await workoutsService.getWorkoutsByDate(date);
    res.json({ workouts });
  } catch (err) {
    next(err);
  }
}

export async function getMonth(req: Request, res: Response, next: NextFunction) {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month || month < 1 || month > 12) {
      res.status(400).json({ error: 'year and month query params required' });
      return;
    }
    const monthStats = await workoutsService.getMonthStats(year, month);
    res.json({ monthStats });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const workout = await workoutsService.createWorkout(parsed.data as CreateWorkoutInput);
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateWorkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const updates = parsed.data as UpdateWorkoutInput;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    const workout = await workoutsService.updateWorkout(req.params.id, updates);
    if (!workout) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await workoutsService.deleteWorkout(req.params.id);
    if (deleted === 0) {
      res.status(404).json({ error: 'Workout not found' });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}
