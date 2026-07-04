import { Redirect } from 'expo-router';

/** @deprecated UGC lives under Campaigns → Public. Kept for deep links. */
export default function UgcJobsRedirect() {
  return <Redirect href="/influencer/(tabs)/campaigns?segment=public" />;
}
