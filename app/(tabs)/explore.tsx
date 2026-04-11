import { Redirect } from 'expo-router';

/** Legacy starter tab — main app uses the influencer stack. */
export default function TabTwoScreen() {
  return <Redirect href="/influencer/dashboard" />;
}
