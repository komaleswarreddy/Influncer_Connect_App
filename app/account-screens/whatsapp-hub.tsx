import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Screen,
  ScrollScreen,
  KollabScreenHeader,
  KollabButton,
  Glyph,
  KollabStatusChip,
  showKollabToast,
  showKollabConfirm,
} from '@/components/ui';
import { useWhatsappStore } from '@/store/whatsapp-store';
import type { WhatsappConversation } from '@/lib/whatsapp-api';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function WhatsappHubScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const {
    isConnected,
    number,
    conversations,
    isLoading,
    error,
    fetchStatus,
    connect,
    disconnect,
    fetchConversations,
    clearError,
  } = useWhatsappStore();

  const refresh = useCallback(async () => {
    await fetchStatus();
    const state = useWhatsappStore.getState();
    if (state.isConnected) {
      await fetchConversations();
    }
  }, [fetchStatus, fetchConversations]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (error) {
      showKollabToast(error);
      clearError();
    }
  }, [error, clearError]);

  const renderConversation = ({ item }: { item: WhatsappConversation }) => (
    <Pressable
      onPress={() => router.push(`/account-screens/whatsapp-conversation?id=${item.id}` as never)}
      style={[styles.row, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
    >
      <View style={[styles.avatar, { backgroundColor: kollab.color.tint }]}>
        <Text style={[styles.avatarInitial, { color: kollab.color.violet }]}>
          {(item.customerProfileName || item.customerWaId).charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: kollab.color.ink }]} numberOfLines={1}>
          {item.customerProfileName || item.customerWaId}
        </Text>
        <Text style={[styles.rowPreview, { color: kollab.color.ink }]} numberOfLines={1}>
          {item.lastMessageDirection === 'outbound' ? 'You: ' : ''}
          {item.lastMessagePreview || 'No messages yet'}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.rowTime, { color: kollab.color.ink }]}>
          {formatRelativeTime(item.lastMessageAt)}
        </Text>
        {item.unreadCount > 0 ? (
          <View style={[styles.unreadDot, { backgroundColor: kollab.color.chartreuse }]}>
            <Text style={[styles.unreadCount, { color: kollab.color.onChartreuse }]}>
              {item.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  if (isLoading && !isConnected && conversations.length === 0) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  if (!isConnected) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="WhatsApp" subtitle="Not connected" />
        <View
          style={[styles.connectCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <View style={[styles.waWell, { backgroundColor: kollab.color.tint }]}>
            <Glyph name="dm" color={kollab.color.violet} size={26} />
          </View>
          <Text style={[styles.connectTitle, { color: kollab.color.ink }]}>
            Connect{' '}
            <Text style={{ fontFamily: font.displayItalic, color: kollab.color.violet }}>
              WhatsApp
            </Text>
          </Text>
          <Text style={[styles.connectBody, { color: kollab.color.ink }]}>
            We assign you a dedicated WhatsApp number. Share it with your audience — messages about
            your products land right here.
          </Text>
          <KollabButton
            label={isLoading ? 'Connecting…' : 'Connect WhatsApp'}
            disabled={isLoading}
            onPress={() => void connect()}
          />
        </View>
      </ScrollScreen>
    );
  }

  return (
    <Screen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="WhatsApp" subtitle={number?.displayPhoneNumber ?? 'Connected'} />

      <View style={[styles.liveBar, { backgroundColor: kollab.color.panel }]}>
        <View style={[styles.liveIcon, { backgroundColor: kollab.color.chartreuse }]}>
          <Glyph name="dm" color={kollab.color.onChartreuse} size={22} />
        </View>
        <View style={styles.liveCopy}>
          <Text style={[styles.liveName, { color: kollab.color.panelInk }]}>
            {number?.displayPhoneNumber}
          </Text>
          <Text style={[styles.liveMeta, { color: kollab.color.panelInk }]}>Connected</Text>
        </View>
        <KollabStatusChip tone="live" label="Live" />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        onRefresh={() => void fetchConversations()}
        refreshing={isLoading}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: kollab.color.ink }]}>
            No conversations yet. Once a customer messages your number, it shows up here.
          </Text>
        }
      />

      <KollabButton
        label="Disconnect WhatsApp"
        variant="hairline"
        onPress={() => {
          void showKollabConfirm({
            title: 'Disconnect WhatsApp?',
            message: 'Your number goes back into the pool and can be assigned to someone else.',
            confirmLabel: 'Disconnect',
            destructive: true,
          }).then((ok) => {
            if (ok) void disconnect();
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  connectCard: { borderRadius: 24, padding: 24, marginBottom: 12 },
  waWell: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  connectTitle: { ...kType.sectionTitle },
  connectBody: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 21,
    opacity: 0.6,
    marginVertical: 8,
  },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  liveIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCopy: { flex: 1 },
  liveName: { fontFamily: font.semiBold, fontSize: 15 },
  liveMeta: { fontFamily: font.body, fontSize: 12, opacity: 0.6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: font.semiBold, fontSize: 17 },
  rowCopy: { flex: 1 },
  rowTitle: { ...kType.rowTitle },
  rowPreview: { fontFamily: font.body, fontSize: 12.5, opacity: 0.6, marginTop: 2 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  rowTime: { fontFamily: font.body, fontSize: 11, opacity: 0.5 },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: { fontFamily: font.semiBold, fontSize: 11 },
  emptyText: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
