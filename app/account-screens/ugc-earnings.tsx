import { Redirect } from 'expo-router';

/** UGC earnings live under Payments — keep route for old deep links. */
export default function UgcEarningsRedirect() {
  return <Redirect href="/account-screens/payments" />;
}
