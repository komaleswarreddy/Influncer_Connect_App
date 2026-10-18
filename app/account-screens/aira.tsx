import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabChatBubble,
  KollabScreenHeader,
  KollabTextField,
  Screen,
  showKollabToast,
} from '@/components/ui';
import {
  AIRA_MAX_CHARS,
  AIRA_STARTERS,
  airaApi,
  type AiraMessage,
  type AiraUsage,
} from '@/lib/aira-api';
import { font, useKollab } from '@/theme/kollab-tokens';

type Row = AiraMessage & { pending?: boolean };

export default function AiraScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const initialId = typeof params.conversationId === 'string' ? params.conversationId : null;

  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [rows, setRows] = useState<Row[]>([]);
  const [usage, setUsage] = useState<AiraUsage | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(Boolean(initialId));
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  // Open the conversation named in the route, or start empty. Switching conversations resets the thread.
  useEffect(() => {
    let live = true;
    setConversationId(initialId);
    setRows([]);
    if (!initialId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    airaApi
      .messages(initialId)
      .then((res) => {
        if (live) setRows(res.messages);
      })
      .catch((e) => {
        if (!live) return;
        showKollabToast(e instanceof Error ? e.message : 'Could not open this chat');
        router.replace('/account-screens/aira' as never);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [initialId, router]);

  useEffect(() => {
    let live = true;
    airaApi
      .usage()
      .then((u) => live && setUsage(u))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (rows.length) scrollToEnd();
  }, [rows.length, sending, scrollToEnd]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;
    if (text.length > AIRA_MAX_CHARS) {
      showKollabToast(`Keep messages under ${AIRA_MAX_CHARS} characters`);
      return;
    }
    if (usage && usage.remaining <= 0) {
      showKollabToast('You have used all of today’s Klear AI messages. They reset tomorrow.');
      return;
    }
    const pendingId = `pending-${Date.now()}`;
    setRows((r) => [
      ...r,
      {
        id: pendingId,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    setInput('');
    setSending(true);
    try {
      const res = await airaApi.chat(text, conversationId);
      setConversationId(res.conversation.id);
      setUsage(res.usage);
      // Swap the optimistic bubble for the saved pair so ids and order match the server.
      setRows((r) => [...r.filter((x) => x.id !== pendingId), res.userMessage, res.reply]);
    } catch (e) {
      // Nothing was saved or charged: take the bubble back and put the text back in the box so it can be retried.
      setRows((r) => r.filter((x) => x.id !== pendingId));
      setInput(text);
      showKollabToast(
        e instanceof Error ? e.message : 'Klear AI could not answer. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const newChat = () => {
    if (conversationId || rows.length) router.replace('/account-screens/aira' as never);
  };

  const limitReached = usage != null && usage.remaining <= 0;

  return (
    <Screen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.head}>
          <KollabScreenHeader
            title="Klear AI"
            subtitle="Your creator AI assistant"
            right={
              <View style={styles.headBtns}>
                <Pressable
                  onPress={newChat}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="New chat"
                >
                  <Ionicons name="create-outline" size={24} color={c.ink} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/account-screens/aira-history' as never)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Chat history"
                >
                  <Ionicons name="time-outline" size={24} color={c.ink} />
                </Pressable>
              </View>
            }
          />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
          ) : rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.hello, { color: c.ink }]}>Hi, I’m Klear AI.</Text>
              <Text style={[styles.helloSub, { color: c.ink }]}>
                Ask me about content ideas, growing your audience, pricing and pitching brands. I
                use your own stats, and I’ll tell you when I don’t have the data.
              </Text>
              <View style={styles.starters}>
                {AIRA_STARTERS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => void send(s)}
                    disabled={sending || limitReached}
                    style={[styles.starter, { backgroundColor: c.card, borderColor: c.outline }]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.starterText, { color: c.ink }]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.disclaimer, { color: c.ink }]}>
                Klear AI can make mistakes and can’t take actions for you. Check important details,
                and ask a professional for legal or tax advice.
              </Text>
            </View>
          ) : (
            rows.map((m) => (
              <View key={m.id} style={[styles.bubbleRow, m.pending && { opacity: 0.6 }]}>
                <KollabChatBubble
                  text={m.content}
                  variant={m.role === 'user' ? 'sent' : 'received'}
                  style={styles.bubble}
                />
              </View>
            ))
          )}
          {sending ? (
            <View style={styles.bubbleRow}>
              <KollabChatBubble
                text="Klear AI is thinking…"
                variant="received"
                style={styles.bubble}
              />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: c.hairline, backgroundColor: c.screen }]}>
          {usage ? (
            <Text style={[styles.usage, { color: limitReached ? c.heat : c.ink }]}>
              {limitReached
                ? 'Daily limit reached. Resets tomorrow.'
                : `${usage.remaining} of ${usage.limit} messages left today`}
            </Text>
          ) : null}
          <View style={styles.inputRow}>
            <KollabTextField
              surface="card"
              value={input}
              onChangeText={setInput}
              placeholder={limitReached ? 'Come back tomorrow' : 'Ask Klear AI anything'}
              editable={!sending && !limitReached}
              multiline
              maxLength={AIRA_MAX_CHARS}
              style={styles.input}
            />
            <Pressable
              onPress={() => void send()}
              disabled={sending || limitReached || !input.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: c.violet,
                  opacity: sending || limitReached || !input.trim() ? 0.4 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              {sending ? (
                <ActivityIndicator color={c.inkOn} />
              ) : (
                <Ionicons name="arrow-up" size={22} color={c.inkOn} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { paddingHorizontal: 22 },
  headBtns: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  thread: { paddingHorizontal: 22, paddingBottom: 12, gap: 10, flexGrow: 1 },
  empty: { gap: 12, paddingTop: 12 },
  hello: { fontFamily: font.display, fontSize: 28 },
  helloSub: { fontFamily: font.body, fontSize: 14.5, lineHeight: 21, opacity: 0.65 },
  starters: { gap: 8, marginTop: 6 },
  starter: { borderWidth: 1.5, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16 },
  starterText: { fontFamily: font.semiBold, fontSize: 14 },
  disclaimer: { fontFamily: font.body, fontSize: 12, opacity: 0.45, lineHeight: 17, marginTop: 10 },
  bubbleRow: {},
  bubble: { maxWidth: '86%' },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  usage: { fontFamily: font.medium, fontSize: 11.5, opacity: 0.55, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, maxHeight: 120, minHeight: 48 },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
