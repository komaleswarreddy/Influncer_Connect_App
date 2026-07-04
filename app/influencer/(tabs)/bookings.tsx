import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScrollScreen } from '@/components/ui';
import { BookingsList } from '@/components/influencer/BookingsList';
import { appShell } from '@/theme';

export default function BookingsTabScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  return (
    <ScrollScreen
      safeAreaEdges={['bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appShell.cta}
          />
        ),
      }}
    >
      <BookingsList
        showHeader={false}
        highlightBookingId={bookingId}
        refreshSignal={refreshing}
        onRefreshDone={() => setRefreshing(false)}
      />
    </ScrollScreen>
  );
}
