import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InboxContent } from '@/components/influencer/InboxContent';
import { appShell } from '@/theme';

export default function InfluencerInvitesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appShell.canvas }}>
      <InboxContent />
    </SafeAreaView>
  );
}
