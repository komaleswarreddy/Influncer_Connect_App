import { Stack } from 'expo-router';
import { useAppShell } from '@/theme';

export default function CampaignsLayout() {
  const shell = useAppShell();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: shell.canvas },
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
          color: shell.textPrimary,
        },
        headerTintColor: shell.cta,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: shell.canvas },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="campaign-progress"
        options={{
          title: 'Campaign Progress',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
