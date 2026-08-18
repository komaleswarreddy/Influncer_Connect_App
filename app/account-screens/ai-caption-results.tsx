import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabButton,
  KollabTextField,
  KollabSectionLabel,
  showKollabToast,
} from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { CaptionSuggestion } from '@/lib/scheduler-api';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';

const TONES = [
  { tone: 'Playful', fill: 'lime' as const },
  { tone: 'Direct', fill: 'tint' as const },
  { tone: 'Story-led', fill: 'teal' as const },
];

export default function AiCaptionResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string; topic?: string }>();
  const {
    captionSuggestions,
    exampleCaptions,
    generateCaptions,
    fetchExampleCaptions,
    isSaving,
    isLoadingExamples,
  } = useSchedulerStore();
  const kollab = useKollab();
  const [picked, setPicked] = useState(0);
  const [topic, setTopic] = useState(typeof params.topic === 'string' ? params.topic : '');
  const [generated, setGenerated] = useState(false);

  const returnTo =
    typeof params.returnTo === 'string' && params.returnTo.length > 0
      ? params.returnTo
      : '/account-screens/create-scheduled-post';

  useFocusEffect(
    useCallback(() => {
      const incomingTopic = typeof params.topic === 'string' ? params.topic.trim() : '';
      if (incomingTopic && useSchedulerStore.getState().captionSuggestions.length > 0) {
        setGenerated(true);
        return;
      }
      setGenerated(false);
      void fetchExampleCaptions('reel');
    }, [fetchExampleCaptions, params.topic])
  );

  const suggestions =
    generated && captionSuggestions.length > 0 ? captionSuggestions : exampleCaptions;
  const showingExamples = !(generated && captionSuggestions.length > 0);
  const canSuggest = topic.trim().length > 0 && !isSaving;

  const applySuggestion = (s: CaptionSuggestion) => {
    router.replace({
      pathname: returnTo as never,
      params: { appliedCaption: s.caption, appliedHashtags: s.hashtags },
    } as never);
  };

  const suggest = async () => {
    const prompt = topic.trim();
    if (!prompt) {
      showKollabToast('Describe the post so we can suggest captions.');
      return;
    }
    try {
      await generateCaptions(prompt, 'reel');
      setGenerated(true);
      setPicked(0);
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Caption generation failed');
    }
  };

  const copyCaption = async (s: CaptionSuggestion) => {
    const text = s.hashtags ? `${s.caption}\n\n${s.hashtags}` : s.caption;
    await Clipboard.setStringAsync(text);
    showKollabToast('Caption copied');
  };

  const toneColors = useMemo(
    () => ({
      lime: { bg: kollab.color.chartreuse, fg: kollab.color.onChartreuse },
      teal: { bg: kollab.color.tealTint, fg: kollab.color.teal },
      tint: { bg: kollab.color.tint, fg: kollab.color.violetDeep },
    }),
    [kollab]
  );

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="AI captions" subtitle="Describe the post, then pick a caption" />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>What’s this post about?</Text>
      <KollabTextField
        surface="well"
        multiline
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. Butter chicken reel for Sunday lunch"
        style={styles.prompt}
      />
      <KollabButton
        label={isSaving ? 'Suggesting…' : 'Suggest captions'}
        variant="ink"
        onPress={() => void suggest()}
        disabled={!canSuggest}
        icon={
          isSaving ? <ActivityIndicator color={kollab.color.chartreuse} size="small" /> : undefined
        }
      />

      <KollabSectionLabel
        label={showingExamples ? 'examples from your profile' : 'suggestions'}
        style={styles.section}
      />

      {isLoadingExamples && exampleCaptions.length === 0 ? (
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 12, marginBottom: 16 }} />
      ) : null}

      {!isLoadingExamples && showingExamples && suggestions.length === 0 ? (
        <Text style={[styles.empty, { color: kollab.color.ink }]}>
          Save your niche and bio in Profile settings to get tailored examples.
        </Text>
      ) : null}

      <View style={styles.list}>
        {suggestions.map((s, i) => {
          const tone = TONES[i % TONES.length];
          const selected = picked === i;
          const colors = toneColors[tone.fill];
          return (
            <Pressable
              key={`${i}-${s.caption.slice(0, 12)}`}
              onPress={() => setPicked(i)}
              style={[
                styles.card,
                {
                  backgroundColor: kollab.color.card,
                  borderColor: selected ? kollab.color.violet : 'transparent',
                },
                kollab.shadow.card,
              ]}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.num, { color: kollab.color.violet }]}>{i + 1}</Text>
                <View style={[styles.tone, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.toneText, { color: colors.fg }]}>{tone.tone}</Text>
                </View>
                <Pressable onPress={() => void copyCaption(s)} style={{ marginLeft: 'auto' }}>
                  <Text style={[styles.copy, { color: kollab.color.violetDeep }]}>Copy</Text>
                </Pressable>
              </View>
              <Text style={[styles.caption, { color: kollab.color.ink }]}>{s.caption}</Text>
              {s.hashtags ? (
                <Text style={[styles.hashtags, { color: kollab.color.ink }]}>{s.hashtags}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <KollabButton
        label="Use this caption"
        onPress={() => {
          const selected = suggestions[picked] ?? suggestions[0];
          if (!selected) {
            showKollabToast('Wait for captions to load.');
            return;
          }
          applySuggestion(selected);
        }}
        disabled={suggestions.length === 0}
        style={styles.useBtn}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  prompt: { minHeight: 88, marginBottom: 12 },
  section: { marginTop: space.md, marginBottom: 10 },
  empty: { fontFamily: font.body, fontSize: 13, opacity: 0.55, marginBottom: 12 },
  list: { gap: 10 },
  card: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  num: { ...kType.rowTitle },
  tone: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  toneText: { fontFamily: font.bold, fontSize: 10.5 },
  copy: { fontFamily: font.bold, fontSize: 12 },
  caption: { fontFamily: font.body, fontSize: 13.5, lineHeight: 20 },
  hashtags: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55, marginTop: 8 },
  useBtn: { marginTop: 16, marginBottom: space.md },
});
