import { z } from 'zod';

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export function parseDateQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = dateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
