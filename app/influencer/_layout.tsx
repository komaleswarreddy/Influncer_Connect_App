import { Stack } from 'expo-router';

export default function InfluencerLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="contract" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="campaign-progress" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
    </Stack>
  );
} 