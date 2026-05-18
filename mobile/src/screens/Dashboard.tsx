import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import api from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { WATER_GOAL_ML } from '../constants/goals';
import { normalizeWeekWater } from '../utils/weekWater';

interface DashboardStats {
  water: { total_ml: number; goal_ml: number };
  meals: { count: number };
  workouts: { total: number; completed: number };
  weekWater: { date: string; total_ml: number }[];
}

const COLORS = {
  water: '#3498db',
  meals: '#e74c3c',
  workout: '#f39c12',
  success: '#27ae60',
  bg: '#f8f9fa',
};

const chartWidth = Dimensions.get('window').width - 64;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  const loadStats = useCallback(async () => {
    try {
      const [waterRes, mealsRes, workoutsRes, weekRes] = await Promise.allSettled([
        api.get(`/water?date=${today}`),
        api.get(`/meals?date=${today}`),
        api.get(`/workouts?date=${today}`),
        api.get('/water/stats/week'),
      ]);

      const water = waterRes.status === 'fulfilled'
        ? waterRes.value.data
        : { total_ml: 0, goal_ml: WATER_GOAL_ML };
      const meals = mealsRes.status === 'fulfilled'
        ? { count: mealsRes.value.data.meals.length }
        : { count: 0 };
      const workoutsData = workoutsRes.status === 'fulfilled'
        ? workoutsRes.value.data.workouts
        : [];
      const weekWater = weekRes.status === 'fulfilled'
        ? weekRes.value.data.stats
        : [];

      setStats({
        water,
        meals,
        workouts: {
          total: workoutsData.length,
          completed: workoutsData.filter((w: { completed: boolean }) => w.completed).length,
        },
        weekWater,
      });
    } catch {
      // partial data is fine
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const chartConfig = useMemo(() => {
    if (!stats) return null;
    const { labels, data } = normalizeWeekWater(stats.weekWater);
    return {
      labels,
      datasets: [{ data, color: () => COLORS.water, strokeWidth: 2 }],
    };
  }, [stats]);

  const score = stats
    ? Math.round(
        (Math.min(stats.water.total_ml / stats.water.goal_ml, 1) * 33) +
        (Math.min(stats.meals.count / 3, 1) * 33) +
        (stats.workouts.total > 0
          ? (stats.workouts.completed / stats.workouts.total) * 34
          : 0)
      )
    : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.success} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá! 👋</Text>
        <Text style={styles.date}>{todayLabel}</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Pontuação do Dia</Text>
        <Text style={styles.scoreValue}>{score}%</Text>
        <ProgressBar current={score} total={100} color={COLORS.success} unit="%" />
      </View>

      <View style={styles.cardsRow}>
        <StatCard
          icon="water"
          color={COLORS.water}
          title="Água"
          value={`${stats?.water.total_ml || 0}ml`}
          subtitle={`Meta: ${stats?.water.goal_ml || WATER_GOAL_ML}ml`}
        />
        <StatCard
          icon="restaurant"
          color={COLORS.meals}
          title="Refeições"
          value={`${stats?.meals.count || 0}`}
          subtitle="registradas hoje"
        />
      </View>
      <View style={styles.cardsRow}>
        <StatCard
          icon="fitness"
          color={COLORS.workout}
          title="Treinos"
          value={`${stats?.workouts.completed || 0}/${stats?.workouts.total || 0}`}
          subtitle="completados"
        />
        <StatCard
          icon="trophy"
          color={COLORS.success}
          title="Score"
          value={`${score}%`}
          subtitle="desempenho geral"
        />
      </View>

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💧 Hidratação</Text>
          <ProgressBar
            current={stats.water.total_ml}
            total={stats.water.goal_ml}
            color={COLORS.water}
            label="Água consumida"
            unit="ml"
          />
        </View>
      )}

      {stats && chartConfig && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Água - Últimos 7 dias</Text>
          <LineChart
            data={chartConfig}
            width={chartWidth}
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: () => COLORS.water,
              labelColor: () => '#7f8c8d',
              propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.water },
            }}
            bezier
            style={styles.chart}
            yAxisSuffix="ml"
            fromZero
          />
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon, color, title, value, subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingBottom: 10 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#2c3e50' },
  date: { fontSize: 14, color: '#7f8c8d', marginTop: 4, textTransform: 'capitalize' },
  scoreCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 4 },
  scoreValue: { fontSize: 42, fontWeight: '800', color: '#27ae60', marginBottom: 8 },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statTitle: { fontSize: 12, color: '#7f8c8d', marginTop: 6 },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  statSubtitle: { fontSize: 11, color: '#95a5a6', marginTop: 2 },
  section: {
    margin: 16,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  chart: { borderRadius: 12, marginLeft: -8 },
});
