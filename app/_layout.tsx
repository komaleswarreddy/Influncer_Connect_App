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

import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/store/auth-store';
import {
  appShell,
  appPaperLight,
  appPaperDark,
  appNavigationLight,
  appNavigationDark,
} from '@/theme';

initSentry();

function RootLayout() {
  const colorScheme = useColorScheme();
  const { loadAuth, isInitialized } = useAuthStore();
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

  // Push (expo-notifications) is intentionally not registered here.
  // Expo Go SDK 53+ errors on any import of that package on Android.

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

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
          <Stack.Screen
            name="register/influencer"
            options={{ title: 'Register', headerShown: false }}
          />
          <Stack.Screen name="influencer" options={{ headerShown: false }} />
          <Stack.Screen name="account-screens" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default wrapWithSentry(RootLayout);
