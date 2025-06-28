import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
 
export default function Index() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  
  if (!isInitialized) {
    return null; // Show nothing while auth is initializing
  }
  
  if (isAuthenticated) {
    return <Redirect href="/influencer/dashboard" />;
  } else {
    return <Redirect href="/login" />;
  }
} 