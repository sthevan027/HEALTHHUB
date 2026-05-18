import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as mealsService from '../services/mealsService';
import { dateSchema, parseDateQuery } from '../utils/validation';
import { CreateMealInput, UpdateMealInput } from '../models/Meal';

const mealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

const createMealSchema = z.object({
  date: dateSchema,
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

export async function getByDate(req: Request, res: Response, next: NextFunction) {
  try {
    const date = parseDateQuery(req.query.date);
    if (!date) {
      res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
      return;
    }
    const meals = await mealsService.getMealsByDate(date);
    res.json({ meals });
  } catch (err) {
    next(err);
  }
}

export async function getWeek(req: Request, res: Response, next: NextFunction) {
  try {
    const start = parseDateQuery(req.query.start);
    if (!start) {
      res.status(400).json({ error: 'start query param required (YYYY-MM-DD)' });
      return;
    }
    const data = await mealsService.getMealsWeek(start);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createMealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const meal = await mealsService.createMeal(parsed.data as CreateMealInput);
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateMealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const updates = parsed.data as UpdateMealInput;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    const meal = await mealsService.updateMeal(req.params.id, updates);
    if (!meal) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    res.json(meal);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await mealsService.deleteMeal(req.params.id);
    if (deleted === 0) {
      res.status(404).json({ error: 'Meal not found' });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}
