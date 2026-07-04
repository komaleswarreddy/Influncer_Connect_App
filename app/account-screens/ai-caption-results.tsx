import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollScreen, SectionHeader, PremiumCard, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { CaptionSuggestion } from '@/lib/scheduler-api';
import { appShell, spacing, radius, palette } from '@/theme';
import { fonts } from '@/components/ui/typography';

function SuggestionCard({
  item,
  index,
  onApply,
}: {
  item: CaptionSuggestion;
  index: number;
  onApply: () => void;
}) {
  return (
    <PremiumCard style={styles.card}>
      <Text style={styles.cardLabel}>Option {index + 1}</Text>
      <Text style={styles.caption}>{item.caption}</Text>
      {item.hashtags ? <Text style={styles.hashtags}>{item.hashtags}</Text> : null}
      <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.88}>
        <Text style={styles.applyText}>Apply</Text>
        <Ionicons name="checkmark-outline" size={16} color={palette.white} />
      </TouchableOpacity>
    </PremiumCard>
  );
}

export default function AiCaptionResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const { captionSuggestions, generateCaptions, isSaving, clearCaptionSuggestions } = useSchedulerStore();

  const returnTo =
    typeof params.returnTo === 'string' && params.returnTo.length > 0
      ? params.returnTo
      : '/account-screens/create-scheduled-post';

  const applySuggestion = (s: CaptionSuggestion) => {
    router.replace({
      pathname: returnTo as never,
      params: { appliedCaption: s.caption, appliedHashtags: s.hashtags },
    } as never);
    clearCaptionSuggestions();
  };

  const retry = async () => {
    const topic = captionSuggestions[0]?.caption?.slice(0, 80) || 'creator content';
    await generateCaptions(topic, 'reel');
  };

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="AI captions" subtitle="Pick one to use" />

      {captionSuggestions.map((s, i) => (
        <SuggestionCard key={`${i}-${s.caption.slice(0, 12)}`} item={s} index={i} onApply={() => applySuggestion(s)} />
      ))}

      <View style={styles.actions}>
        <SecondaryButton label="Try new ones" onPress={() => void retry()} />
        <PrimaryButton label="Back" onPress={() => router.back()} />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, gap: spacing.xs },
  cardLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: appShell.textMuted },
  caption: { fontFamily: fonts.regular, fontSize: 15, color: appShell.textPrimary, lineHeight: 22 },
  hashtags: { fontFamily: fonts.regular, fontSize: 13, color: appShell.cta },
  applyBtn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: appShell.cta,
  },
  applyText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#fff' },
  actions: { marginTop: spacing.md, gap: spacing.sm },
});
