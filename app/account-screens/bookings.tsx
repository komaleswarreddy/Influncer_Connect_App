import React from 'react';
import { Screen } from '@/components/ui';
import { BookingsList } from '@/components/influencer/BookingsList';

export default function BookingsScreen() {
  return (
    <Screen padH={0} safeAreaEdges={['top', 'left', 'right']}>
      <BookingsList />
    </Screen>
  );
}
