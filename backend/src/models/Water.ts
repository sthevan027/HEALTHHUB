export interface WaterIntake {
  id: string;
  date: string;
  amount_ml: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWaterInput {
  date: string;
  amount_ml: number;
}
