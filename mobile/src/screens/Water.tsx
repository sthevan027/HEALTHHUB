import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useWater } from '../hooks/useWater';

const QUICK_AMOUNTS = [250, 500, 750, 1000];
const COLORS = { water: '#3498db', bg: '#f8f9fa' };

export default function WaterScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, fetchWater, addWater, deleteWater } = useWater();
  const [customModal, setCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLabel = format(new Date(), "d 'de' MMMM", { locale: ptBR });
  const pct = Math.min(Math.round((data.total_ml / data.goal_ml) * 100), 100);

  useEffect(() => { fetchWater(today); }, [fetchWater, today]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWater(today);
    setRefreshing(false);
  }, [fetchWater, today]);

  const handleAdd = useCallback(async (amount: number) => {
    try {
      await addWater(amount, today);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar água. Verifique sua conexão.');
    }
  }, [addWater, today]);

  const handleCustomAdd = useCallback(async () => {
    const amount = parseInt(customAmount, 10);
    if (!amount || amount <= 0 || amount > 5000) {
      Alert.alert('Valor inválido', 'Digite um valor entre 1 e 5000 ml');
      return;
    }
    setCustomModal(false);
    setCustomAmount('');
    await handleAdd(amount);
  }, [customAmount, handleAdd]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert('Remover entrada', 'Deseja remover este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => deleteWater(id, today) },
    ]);
  }, [deleteWater, today]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>💧 Hidratação</Text>
        <Text style={styles.date}>{todayLabel}</Text>
      </View>

      {/* Circular Progress */}
      <View style={styles.circleContainer}>
        <View style={styles.circle}>
          {loading ? (
            <ActivityIndicator color={COLORS.water} size="large" />
          ) : (
            <>
              <Text style={styles.circlePct}>{pct}%</Text>
              <Text style={styles.circleMl}>{data.total_ml} ml</Text>
              <Text style={styles.circleGoal}>de {data.goal_ml} ml</Text>
            </>
          )}
        </View>
        <View
          style={[
            styles.circleProgress,
            { borderColor: pct === 100 ? '#27ae60' : COLORS.water, opacity: 0.3 + (pct / 100) * 0.7 },
          ]}
        />
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickSection}>
        <Text style={styles.sectionTitle}>Adicionar rápido</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.quickBtn}
              onPress={() => handleAdd(amount)}
            >
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={styles.quickBtnText}>{amount}ml</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.customBtn}
          onPress={() => setCustomModal(true)}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.water} />
          <Text style={styles.customBtnText}>Quantidade customizada</Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Histórico de hoje</Text>
        {data.entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="water-outline" size={40} color="#bdc3c7" />
            <Text style={styles.emptyText}>Nenhum registro ainda</Text>
          </View>
        ) : (
          data.entries.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <Ionicons name="water" size={20} color={COLORS.water} />
              <View style={styles.historyInfo}>
                <Text style={styles.historyAmount}>{entry.amount_ml} ml</Text>
                <Text style={styles.historyTime}>
                  {format(new Date(entry.created_at), 'HH:mm')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Custom Modal */}
      <Modal visible={customModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quantidade customizada</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 350"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus
            />
            <Text style={styles.inputHint}>Valor em ml (1 - 5000)</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => { setCustomModal(false); setCustomAmount(''); }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleCustomAdd}
              >
                <Text style={styles.confirmText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#2c3e50' },
  date: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  circleContainer: { alignItems: 'center', marginVertical: 24, position: 'relative' },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 6,
    borderColor: COLORS.water,
  },
  circleProgress: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
  },
  circlePct: { fontSize: 40, fontWeight: '800', color: COLORS.water },
  circleMl: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  circleGoal: { fontSize: 12, color: '#7f8c8d' },
  quickSection: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.water,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  customBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.water,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  customBtnText: { color: COLORS.water, fontWeight: '600', fontSize: 14 },
  historySection: { marginHorizontal: 16, marginBottom: 32 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyInfo: { flex: 1 },
  historyAmount: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  historyTime: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#bdc3c7', marginTop: 10, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 16 },
  input: {
    borderWidth: 2,
    borderColor: COLORS.water,
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputHint: { fontSize: 12, color: '#7f8c8d', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#ecf0f1' },
  confirmBtn: { backgroundColor: COLORS.water },
  cancelText: { color: '#7f8c8d', fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
