import { Redirect } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '@/store/auth-store';

export default function Index() {
  const { isAuthenticated, isInitialized, nextStep } = useAuthStore();

  if (!isInitialized) {
    return null; // Show nothing while auth is initializing
  }

  if (isAuthenticated) {
    return <Redirect href={getInfluencerEntryPath(nextStep)} />;
  }
  return <Redirect href="/login" />;
} 