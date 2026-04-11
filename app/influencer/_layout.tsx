import { Stack, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { appShell } from '@/theme';

export default function InfluencerLayout() {
  const { isAuthenticated, isInitialized, refreshSession } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      void refreshSession();
    }
  }, [isAuthenticated, isInitialized, refreshSession]);

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: appShell.canvas },
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: appShell.textPrimary },
        headerTintColor: appShell.cta,
        contentStyle: { backgroundColor: appShell.canvas },
      }}
    >
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