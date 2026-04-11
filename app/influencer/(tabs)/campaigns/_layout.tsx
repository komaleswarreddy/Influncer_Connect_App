import { Stack } from 'expo-router';
import { appShell } from '@/theme';

export default function CampaignsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: appShell.canvas },
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: appShell.textPrimary },
        headerTintColor: appShell.cta,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: appShell.canvas },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Campaigns',
          headerShown: true,
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
