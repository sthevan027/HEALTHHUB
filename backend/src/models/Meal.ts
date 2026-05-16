export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  date: string;
  meal_type: MealType;
  name: string;
  calories?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMealInput {
  date: string;
  meal_type: MealType;
  name: string;
  calories?: number;
  description?: string;
}

export interface UpdateMealInput {
  meal_type?: MealType;
  name?: string;
  calories?: number;
  description?: string;
}
