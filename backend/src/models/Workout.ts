export interface Workout {
  id: string;
  date: string;
  exercise: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkoutInput {
  date: string;
  exercise: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateWorkoutInput {
  exercise?: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
  completed?: boolean;
}
