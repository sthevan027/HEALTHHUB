import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWaterNotification(percentage: number): Promise<void> {
  const messages: Record<number, string> = {
    50: '💧 Você completou 50% da meta de água!',
    75: '💧 75% da meta! Continue assim!',
    100: '🎉 Parabéns! Meta de água atingida hoje!',
  };

  const body = messages[percentage];
  if (!body) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HealthHub - Hidratação',
      body,
    },
    trigger: null,
  });
}
