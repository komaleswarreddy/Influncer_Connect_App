import { Stack } from 'expo-router';
import { useKollab } from '@/theme/kollab-tokens';

/**
 * Cognito / OAuth deep-link routes — no chrome, no animation flash.
 */
export default function AuthDeepLinkLayout() {
  const kollab = useKollab();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: kollab.color.screen },
      }}
    />
  );
}
