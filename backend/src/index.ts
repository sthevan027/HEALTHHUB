import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import waterRoutes from './routes/water';
import mealsRoutes from './routes/meals';
import workoutsRoutes from './routes/workouts';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/water', waterRoutes);
app.use('/meals', mealsRoutes);
app.use('/workouts', workoutsRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] HealthHub API running on port ${PORT}`);
});

export default app;
