import { Redirect } from 'expo-router';

/** Legacy route — main influencer UI lives under `/influencer`. */
export default function DashboardScreen() {
  return <Redirect href="/influencer/dashboard" />;
}
