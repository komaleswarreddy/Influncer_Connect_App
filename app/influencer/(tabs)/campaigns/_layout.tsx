import { Stack } from 'expo-router';
import { useKollab } from '@/theme/kollab-tokens';

export default function CampaignsLayout() {
  const kollab = useKollab();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: kollab.color.screen },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
