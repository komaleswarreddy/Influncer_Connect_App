import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabButton,
  KollabChatBubble,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import {
  instagramAutomationApi,
  type DmAutomation,
  type DmAutomationLog,
} from '@/lib/instagram-automation-api';
import { useKollab, font } from '@/theme/kollab-tokens';

const TRIGGER_LABELS: Record<string, string> = {
  comment_keyword: 'Comment keyword',
  story_reply: 'Story reply',
  dm_keyword: 'DM keyword',
};

export default function AutomationDetailScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { automationId } = useLocalSearchParams<{ automationId: string }>();
  const { toggleAutomation, deleteAutomation, isSaving } = useInstagramAutomationStore();

  const [automation, setAutomation] = useState<DmAutomation | null>(null);
  const [logs, setLogs] = useState<DmAutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAutomation = useCallback(async () => {
    if (!automationId) return;
    setLoading(true);
    try {
      const res = await instagramAutomationApi.getAutomations();
      const found = res.automations.find((a) => a.id === automationId) ?? null;
      setAutomation(found);
      if (!found) {
        showKollabToast('Automation could not be loaded.');
        router.back();
      } else {
        try {
          const logRes = await instagramAutomationApi.getAutomationLogs(automationId, 1);
          setLogs(logRes.logs);
        } catch {
          setLogs([]);
        }
      }
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [automationId, router]);

  useEffect(() => {
    void loadAutomation();
  }, [loadAutomation]);

  const handleToggle = async () => {
    if (!automation) return;
    await toggleAutomation(automation.id);
    setAutomation({ ...automation, isActive: !automation.isActive });
  };

  const handleDelete = () => {
    if (!automation) return;
    void showKollabConfirm({
      title: 'Delete automation?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    }).then((ok) => {
      if (!ok) return;
      void deleteAutomation(automation.id).then(() => {
        router.replace('/account-screens/dm-automation' as never);
      });
    });
  };

  if (loading && !automation) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  if (!automation) return null;

  const rows = [
    { label: 'Trigger', value: TRIGGER_LABELS[automation.triggerType] ?? automation.triggerType },
    { label: 'Match', value: automation.matchType },
    { label: 'Reply', value: automation.replyType.replace(/_/g, ' ') },
    { label: 'Status', value: automation.isActive ? 'Active' : 'Paused' },
  ];
  const previewIn = automation.triggerKeywords[0] || 'LINK';
  const previewOut =
    automation.replyMessages[0] || automation.aiContext?.slice(0, 80) || 'Thanks for reaching out!';

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title={automation.name} subtitle="Automation details" />

      <View style={[styles.rowsCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        {rows.map((r, i) => (
          <View
            key={r.label}
            style={[
              styles.row,
              { borderBottomColor: i === rows.length - 1 ? 'transparent' : kollab.color.hairline },
            ]}
          >
            <Text style={[styles.rowLabel, { color: kollab.color.ink }]}>{r.label}</Text>
            <Text style={[styles.rowValue, { color: kollab.color.ink }]}>{r.value}</Text>
          </View>
        ))}
      </View>

      {automation.triggerKeywords.length > 0 ? (
        <>
          <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Keywords</Text>
          <View style={styles.kwRow}>
            {automation.triggerKeywords.map((k) => (
              <View key={k} style={[styles.kw, { backgroundColor: kollab.color.tint }]}>
                <Text style={[styles.kwText, { color: kollab.color.violetDeep }]}>{k}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Reply preview</Text>
      <View style={[styles.preview, { backgroundColor: kollab.color.tint }]}>
        <KollabChatBubble variant="received" text={previewIn} />
        <KollabChatBubble variant="sent" text={previewOut} />
      </View>

      <KollabButton
        label={automation.isActive ? 'Pause automation' : 'Resume automation'}
        variant="hairline"
        disabled={isSaving}
        onPress={() => void handleToggle()}
      />
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/account-screens/create-automation',
            params: { automationId: automation.id },
          } as never)
        }
        style={styles.editLink}
      >
        <Text style={[styles.editText, { color: kollab.color.violetDeep }]}>Edit</Text>
      </Pressable>
      <Pressable onPress={handleDelete} style={styles.editLink}>
        <Text style={[styles.editText, { color: kollab.color.heat }]}>Delete</Text>
      </Pressable>

      {logs.length > 0 ? (
        <View style={[styles.rowsCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
          {logs.slice(0, 8).map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.row,
                {
                  borderBottomColor:
                    i === Math.min(logs.length, 8) - 1 ? 'transparent' : kollab.color.hairline,
                },
              ]}
            >
              <Text style={[styles.rowLabel, { color: kollab.color.ink }]} numberOfLines={1}>
                @{item.triggerUsername ?? item.triggerUserId}
              </Text>
              <Text style={[styles.rowValue, { color: kollab.color.ink }]}>
                {item.deliveryStatus}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  rowsCard: { borderRadius: 22, paddingHorizontal: 18, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowLabel: { width: 104, fontFamily: font.body, fontSize: 12.5, opacity: 0.55 },
  rowValue: { flex: 1, fontFamily: font.semiBold, fontSize: 13.5, textAlign: 'right' },
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  kw: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6 },
  kwText: { fontFamily: font.bold, fontSize: 11.5 },
  preview: { borderRadius: 20, padding: 16, marginBottom: 18, gap: 8 },
  editLink: { alignItems: 'center', paddingVertical: 12 },
  editText: { fontFamily: font.semiBold, fontSize: 13.5 },
});
