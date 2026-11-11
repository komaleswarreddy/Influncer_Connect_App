import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useKeyboardInset } from '@/lib/use-keyboard-inset';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Screen, KollabScreenHeader, showKollabToast } from '@/components/ui';
import { useWhatsappStore } from '@/store/whatsapp-store';
import type { WhatsappMessage } from '@/lib/whatsapp-api';
import { useKollab, font } from '@/theme/kollab-tokens';

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function WhatsappConversationScreen() {
  const keyboardInset = useKeyboardInset();
  const router = useRouter();
  const kollab = useKollab();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    conversations,
    activeMessages,
    activeWindowOpen,
    isLoading,
    isSending,
    error,
    fetchMessages,
    sendReply,
    clearError,
  } = useWhatsappStore();
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<WhatsappMessage>>(null);

  const conversation = conversations.find((c) => c.id === id);

  const refresh = useCallback(async () => {
    if (id) await fetchMessages(id);
  }, [id, fetchMessages]);

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

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !id) return;
    setDraft('');
    try {
      await sendReply(id, text);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setDraft(text); // restore on failure so the influencer doesn't lose what they typed
    }
  };

  const renderMessage = ({ item }: { item: WhatsappMessage }) => {
    const isOutbound = item.direction === 'outbound';
    return (
      <View style={[styles.bubbleRow, isOutbound ? styles.bubbleRowOut : styles.bubbleRowIn]}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOutbound ? kollab.color.chartreuse : kollab.color.card,
              borderTopRightRadius: isOutbound ? 4 : 18,
              borderTopLeftRadius: isOutbound ? 18 : 4,
            },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isOutbound ? kollab.color.onChartreuse : kollab.color.ink },
            ]}
          >
            {item.body || `[${item.messageType}]`}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              { color: isOutbound ? kollab.color.onChartreuse : kollab.color.ink },
            ]}
          >
            {formatMessageTime(item.createdAt)}
            {isOutbound && item.status === 'failed' ? ' · failed' : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen safeAreaEdges={['top', 'left', 'right', 'bottom']} padH={0}>
      <View style={{ paddingHorizontal: 22 }}>
        <KollabScreenHeader
          title={conversation?.customerProfileName || conversation?.customerWaId || 'Chat'}
          subtitle={conversation?.customerWaId}
          backTone="well"
          onBack={() => router.back()}
        />
      </View>

      {isLoading && activeMessages.length === 0 ? (
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 32 }} />
      ) : (
        <View style={{ flex: 1, paddingBottom: keyboardInset }}>
          <FlatList
            ref={listRef}
            style={{ flex: 1, paddingHorizontal: 22 }}
            data={activeMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />

          {!activeWindowOpen ? (
            <View style={[styles.windowBanner, { backgroundColor: kollab.color.panel }]}>
              <Text style={[styles.windowBannerText, { color: kollab.color.panelInk }]}>
                It&apos;s been over 24h since {conversation?.customerProfileName || 'this customer'}{' '}
                last messaged — send a message from your own WhatsApp, or wait for them to write in
                again, to reopen replying here.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.composer,
                { backgroundColor: kollab.color.card, borderTopColor: kollab.color.hairline },
              ]}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a reply…"
                placeholderTextColor={kollab.color.ink + '80'}
                style={[styles.input, { color: kollab.color.ink }]}
                multiline
                maxLength={4096}
              />
              <Pressable
                onPress={() => void onSend()}
                disabled={isSending || !draft.trim()}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: kollab.color.chartreuse,
                    opacity: isSending || !draft.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.sendButtonText, { color: kollab.color.onChartreuse }]}>
                  Send
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row' },
  bubbleRowIn: { justifyContent: 'flex-start' },
  bubbleRowOut: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleText: { fontFamily: font.body, fontSize: 14.5, lineHeight: 20 },
  bubbleTime: {
    fontFamily: font.body,
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'right',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 14.5,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  sendButtonText: { fontFamily: font.semiBold, fontSize: 13.5 },
  windowBanner: { margin: 16, borderRadius: 16, padding: 14 },
  windowBannerText: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, opacity: 0.8 },
});
