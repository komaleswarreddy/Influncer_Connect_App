import { Redirect } from 'expo-router';

/** @deprecated Ratings live under My Stats. Kept for deep links. */
export default function RatingsRedirect() {
  return <Redirect href="/influencer/rating-cards" />;
}
