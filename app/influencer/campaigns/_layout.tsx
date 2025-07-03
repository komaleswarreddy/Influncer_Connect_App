import { Stack } from 'expo-router';

export default function CampaignsLayout() {
  return (
    <Stack>
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