import React from 'react';
import { ScrollScreen } from '@/components/ui';
import { BookingsList } from '@/components/influencer/BookingsList';

export default function BookingsScreen() {
  return (
    <ScrollScreen>
      <BookingsList />
    </ScrollScreen>
  );
}
