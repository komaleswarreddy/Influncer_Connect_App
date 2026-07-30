import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InboxContent } from '@/components/influencer/InboxContent';
import { useAppShell } from '@/theme';

export default function InboxTabScreen() {
  const shell = useAppShell();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: shell.canvas }} edges={['left', 'right']}>
      <InboxContent />
    </SafeAreaView>
  );
}
