import React from 'react';
import { Screen } from '@/components/ui';
import { BookingsList } from '@/components/influencer/BookingsList';

export default function BookingsScreen() {
  return (
    <Screen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <BookingsList />
    </Screen>
  );
}
