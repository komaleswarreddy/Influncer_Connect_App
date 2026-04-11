import { Redirect } from 'expo-router';

/** Starter template tab — app shell is the influencer stack. */
export default function HomeScreen() {
  return <Redirect href="/influencer/dashboard" />;
}
