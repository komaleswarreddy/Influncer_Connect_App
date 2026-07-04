import { Stack, Redirect, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { appShell } from '@/theme';

export default function InfluencerLayout() {
  const { isAuthenticated, isInitialized, refreshSession, nextStep } = useAuthStore();
  const segments = useSegments();

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

  const onPendingScreen = segments.includes('pending-approval');
  if (nextStep === 'PENDING_PLATFORM_APPROVAL' && !onPendingScreen) {
    return <Redirect href="/influencer/pending-approval" />;
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
      <Stack.Screen name="pending-approval" options={{ title: 'Approval', headerShown: true }} />
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
      <Stack.Screen name="ugc-brief-detail" options={{ title: 'UGC Brief' }} />
      <Stack.Screen name="ugc-deliver" options={{ title: 'Deliver' }} />
      <Stack.Screen name="booking-deliver" options={{ title: 'Deliver' }} />
      <Stack.Screen name="rating-cards" options={{ title: 'Campaign Ratings' }} />
    </Stack>
  );
} 