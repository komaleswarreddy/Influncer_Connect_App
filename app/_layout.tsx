import { ThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { initSentry, wrapWithSentry } from '@/lib/sentry';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import {
  appShellDark,
  appShellLight,
  appPaperLight,
  appPaperDark,
  appNavigationLight,
  appNavigationDark,
  useAppShell,
} from '@/theme';
import { PremiumToastHost } from '@/components/ui';

initSentry();

function RootLayout() {
  const { loadAuth, isInitialized } = useAuthStore();
  const appearance = useThemeStore((s) => s.appearance);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const shell = useAppShell();
  const isDark = appearance === 'dark';
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
    void hydrateTheme();
  }, [hydrateTheme]);

  // Push (expo-notifications) is intentionally not registered here.
  // Expo Go SDK 53+ errors on any import of that package on Android.

  if (!loaded || !isInitialized || !themeHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? appShellDark.canvas : appShellLight.canvas,
        }}
      >
        <ActivityIndicator size="large" color={isDark ? appShellDark.cta : appShellLight.cta} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
          <Stack.Screen
            name="register/influencer"
            options={{ title: 'Register', headerShown: false }}
          />
          <Stack.Screen name="auth" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="influencer" options={{ headerShown: false }} />
          <Stack.Screen name="account-screens" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <PremiumToastHost />
        <StatusBar style={shell.isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default wrapWithSentry(RootLayout);
