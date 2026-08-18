import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KollabScreenHeader, Screen } from '@/components/ui';
import { InboxContent } from '@/components/influencer/InboxContent';

export default function InboxScreen() {
  return (
    <Screen padH={0}>
      <View style={styles.head}>
        <KollabScreenHeader
          title="Inbox"
          subtitle="Invites and collab notifications"
          size="stack"
          backTone="card"
        />
      </View>
      <InboxContent showHeader={false} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 6,
  },
});
