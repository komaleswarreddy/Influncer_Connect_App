import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui';
import { BookingsList } from '@/components/influencer/BookingsList';

export default function BookingsTabScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();

  return (
    <Screen safeAreaEdges={['top', 'left', 'right', 'bottom']} dotBackground={false}>
      <BookingsList showHeader={false} highlightBookingId={bookingId} />
    </Screen>
  );
}
