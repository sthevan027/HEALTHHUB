import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  current: number;
  total: number;
  color: string;
  label?: string;
  unit?: string;
}

export default function ProgressBar({ current, total, color, label, unit = '' }: Props) {
  const pct = Math.min((current / total) * 100, 100);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color }]}>
            {current}{unit} / {total}{unit}
          </Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pct, { color }]}>{Math.round(pct)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: '#7f8c8d' },
  value: { fontSize: 13, fontWeight: '600' },
  track: { height: 10, backgroundColor: '#ecf0f1', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  pct: { fontSize: 11, textAlign: 'right', marginTop: 2, fontWeight: '600' },
});
