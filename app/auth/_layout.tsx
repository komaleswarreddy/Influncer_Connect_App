import { Stack } from 'expo-router';

/**
 * Cognito / OAuth deep-link routes — no chrome, no animation flash.
 */
export default function AuthDeepLinkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: '#F4F6FC' },
      }}
    />
  );
}
