import { ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '@/lib/kinde-secure-store-bootstrap';
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications, routeFromPushData } from '@/lib/push-notifications';
import { PaperProvider } from 'react-native-paper';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/store/auth-store';
import { KindeAuthProvider } from '@kinde/expo';
import { kindeConfigured, kindeDomain, kindeClientId } from '@/lib/auth-config';
import { appShell, appPaperLight, appPaperDark, appNavigationLight, appNavigationDark } from '@/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { loadAuth, isInitialized, user } = useAuthStore();
  const pushRegistered = useRef(false);
  const isDark = colorScheme === 'dark';
  const paperTheme = isDark ? appPaperDark : appPaperLight;
  const navTheme = isDark ? appNavigationDark : appNavigationLight;

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (!isInitialized || !user?.id || pushRegistered.current) return;
    pushRegistered.current = true;
    void registerForPushNotifications();
  }, [isInitialized, user?.id]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
      const path = routeFromPushData(data as never);
      if (path) router.push(path as never);
    });
    return () => sub.remove();
  }, [router]);

  if (!loaded || !isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: appShell.canvas,
        }}
      >
        <ActivityIndicator size="large" color={appShell.cta} />
      </View>
    );
  }

  const stack = (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
          <Stack.Screen name="register/influencer" options={{ title: 'Register', headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard', headerShown: false }} />
          <Stack.Screen name="influencer" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account-screens" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );

  if (kindeConfigured) {
    return (
      <KindeAuthProvider
        config={{
          domain: kindeDomain,
          clientId: kindeClientId,
          scopes: 'openid profile email offline',
        }}
      >
        {stack}
      </KindeAuthProvider>
    );
  }

  return stack;
}
