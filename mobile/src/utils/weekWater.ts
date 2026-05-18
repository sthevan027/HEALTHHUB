import { eachDayOfInterval, format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface WeekWaterPoint {
  date: string;
  total_ml: number;
}

export function normalizeWeekWater(stats: WeekWaterPoint[]): {
  labels: string[];
  data: number[];
} {
  const end = new Date();
  const start = subDays(end, 6);
  const days = eachDayOfInterval({ start, end });

  const data = days.map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const found = stats.find((s) => String(s.date).slice(0, 10) === key);
    return found ? Number(found.total_ml) : 0;
  });

  const labels = days.map((d) => format(d, 'EEE', { locale: ptBR }));

  return { labels, data };
}
