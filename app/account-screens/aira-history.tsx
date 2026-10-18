import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { airaApi, type AiraConversation } from '@/lib/aira-api';
import { timeAgo } from '@/lib/leads-ui';
import { font, useKollab } from '@/theme/kollab-tokens';

export default function AiraHistoryScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const [items, setItems] = useState<AiraConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await airaApi.conversations();
      setItems(res.conversations);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const remove = async (item: AiraConversation) => {
    const ok = await showKollabConfirm({
      title: 'Delete this chat?',
      message: `“${item.title}” and its messages will be removed permanently.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(item.id);
    try {
      await airaApi.remove(item.id);
      setItems((list) => list.filter((x) => x.id !== item.id));
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not delete this chat');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Chat history" subtitle="Your conversations with Klear AI" />
      <KollabButton
        label="New chat"
        variant="ink"
        onPress={() => router.replace('/account-screens/aira' as never)}
        style={styles.new}
      />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 24 }} />
      ) : error ? (
        <KollabEmptyCard
          title="Couldn’t load your chats"
          subtitle={error}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load();
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : items.length === 0 ? (
        <KollabEmptyCard
          title="No chats yet"
          subtitle="Ask Klear AI for content ideas, pricing help or a brand pitch and your conversations will appear here."
          ctaLabel="Start a chat"
          onPress={() => router.replace('/account-screens/aira' as never)}
          style={{ marginHorizontal: 0 }}
        />
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}
            >
              <Pressable
                style={styles.cardMain}
                onPress={() =>
                  router.replace(`/account-screens/aira?conversationId=${item.id}` as never)
                }
                accessibilityRole="button"
                accessibilityLabel={`Open chat ${item.title}`}
              >
                <Text style={[styles.title, { color: c.ink }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.meta, { color: c.ink }]}>{timeAgo(item.lastMessageAt)}</Text>
              </Pressable>
              {deleting === item.id ? (
                <ActivityIndicator color={c.ink} />
              ) : (
                <Pressable
                  onPress={() => void remove(item)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete chat ${item.title}`}
                >
                  <Ionicons name="trash-outline" size={22} color={c.heat} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  new: { marginBottom: 14 },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  cardMain: { flex: 1, gap: 4 },
  title: { fontFamily: font.bold, fontSize: 15 },
  meta: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55 },
});
