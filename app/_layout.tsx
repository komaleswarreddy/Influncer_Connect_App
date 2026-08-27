import { ThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';
import { initSentry, wrapWithSentry } from '@/lib/sentry';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import {
  appPaperLight,
  appPaperDark,
  appNavigationLight,
  appNavigationDark,
  useAppShell,
  useKollab,
} from '@/theme';
import { PremiumToastHost, KollabDialogHost } from '@/components/ui';

initSentry();

function RootLayout() {
  const { loadAuth, isInitialized } = useAuthStore();
  const appearance = useThemeStore((s) => s.appearance);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const shell = useAppShell();
  const kollab = useKollab();
  const isDark = appearance === 'dark';
  const paperTheme = isDark ? appPaperDark : appPaperLight;
  const navTheme = isDark ? appNavigationDark : appNavigationLight;

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Sora_600SemiBold,
    Sora_700Bold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(kollab.color.screen);
  }, [kollab.color.screen]);

  // Push (expo-notifications) is intentionally not registered here.
  // Expo Go SDK 53+ errors on any import of that package on Android.

  if (!loaded || !isInitialized || !themeHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: kollab.color.screen,
        }}
      >
        <ActivityIndicator size="large" color={kollab.color.ink} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ contentStyle: { backgroundColor: kollab.color.screen } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
          <Stack.Screen
            name="register/influencer"
            options={{ title: 'Register', headerShown: false }}
          />
          <Stack.Screen
            name="register/verify-phone"
            options={{ title: 'Verify phone', headerShown: false }}
          />
          <Stack.Screen
            name="register/verify-email"
            options={{ title: 'Verify email', headerShown: false }}
          />
          <Stack.Screen name="login-otp" options={{ title: 'Enter code', headerShown: false }} />
          <Stack.Screen
            name="login-email-otp"
            options={{ title: 'Enter code', headerShown: false }}
          />
          <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="influencer" options={{ headerShown: false }} />
          <Stack.Screen name="account-screens" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <PremiumToastHost />
        <KollabDialogHost />
        <StatusBar style={shell.isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default wrapWithSentry(RootLayout);
