import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollScreen,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  PremiumCard,
  PremiumSegmentedControl,
} from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import {
  instagramAutomationApi,
  type CreateAutomationPayload,
  type DmMatchType,
  type DmReplyType,
  type DmTriggerType,
  type InstagramMediaItem,
} from '@/lib/instagram-automation-api';
import { spacing, radius, palette, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';

const STEPS = ['Content', 'Trigger', 'Reply', 'Review'] as const;
type Step = (typeof STEPS)[number];

type MediaTab = 'reels' | 'posts' | 'stories';

const ALL_TRIGGER_OPTIONS: { key: DmTriggerType; label: string }[] = [
  { key: 'comment_keyword', label: 'Comment keyword' },
  { key: 'story_reply', label: 'Story reply' },
];

const MATCH_OPTIONS: { key: DmMatchType; label: string }[] = [
  { key: 'contains', label: 'Contains' },
  { key: 'exact', label: 'Exact' },
  { key: 'any', label: 'Any message' },
];

const REPLY_OPTIONS: { key: DmReplyType; label: string }[] = [
  { key: 'text', label: 'Custom' },
  { key: 'text_with_link', label: 'Text + link' },
  { key: 'ai_generated', label: 'AI replies' },
];

const MEDIA_TABS: { key: MediaTab; label: string }[] = [
  { key: 'reels', label: 'Reels' },
  { key: 'posts', label: 'Posts' },
  { key: 'stories', label: 'Stories' },
];

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function formatKeywords(keywords: string[]): string {
  return keywords.join(', ');
}

function defaultForm(): CreateAutomationPayload {
  return {
    name: '',
    triggerType: 'comment_keyword',
    triggerKeywords: [],
    matchType: 'contains',
    replyType: 'ai_generated',
    replyMessages: [''],
    replyLink: '',
    replyLinkLabel: '',
    publicCommentReply: '',
    aiContext: '',
    postFilter: 'specific_post',
    specificPostId: '',
  };
}

function triggerOptionsForMedia(media: InstagramMediaItem | null) {
  if (!media) return ALL_TRIGGER_OPTIONS;
  if (media.kind === 'story') {
    return ALL_TRIGGER_OPTIONS.filter((o) => o.key === 'story_reply');
  }
  return ALL_TRIGGER_OPTIONS.filter((o) => o.key === 'comment_keyword');
}

export default function CreateAutomationScreen() {
  const shell = useAppShell();
  const router = useRouter();
  const { automationId } = useLocalSearchParams<{ automationId?: string }>();
  const isEdit = Boolean(automationId);
  const { createAutomation, updateAutomation, previewAi, isSaving } = useInstagramAutomationStore();

  const [step, setStep] = useState<Step>(isEdit ? 'Trigger' : 'Content');
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [form, setForm] = useState<CreateAutomationPayload>(defaultForm());
  const [keywordsText, setKeywordsText] = useState('');
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [mediaTab, setMediaTab] = useState<MediaTab>('reels');
  const [mediaItems, setMediaItems] = useState<InstagramMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<InstagramMediaItem | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const triggerOptions = useMemo(() => triggerOptionsForMedia(selectedMedia), [selectedMedia]);

  const loadMedia = useCallback(
    async (refresh = false) => {
      setMediaLoading(true);
      try {
        const res = await instagramAutomationApi.listMedia(mediaTab, { refresh });
        setMediaItems(res.items);
      } catch (e) {
        Alert.alert('Could not load content', e instanceof Error ? e.message : 'Try again');
      } finally {
        setMediaLoading(false);
      }
    },
    [mediaTab]
  );

  useEffect(() => {
    if (step === 'Content') {
      void loadMedia(false);
    }
  }, [step, mediaTab, loadMedia]);

  const loadExisting = useCallback(async () => {
    if (!automationId) return;
    setLoadingExisting(true);
    try {
      const res = await instagramAutomationApi.getAutomations();
      const existing = res.automations.find((a) => a.id === automationId);
      if (!existing) {
        Alert.alert('Not found', 'Automation could not be loaded.');
        router.back();
        return;
      }
      const postId = existing.specificPostId?.trim() || '';
      setForm({
        name: existing.name,
        triggerType: existing.triggerType,
        triggerKeywords: existing.triggerKeywords,
        matchType: existing.matchType,
        replyType: existing.replyType,
        replyMessages: existing.replyMessages.length ? existing.replyMessages : [''],
        replyLink: existing.replyLink ?? '',
        replyLinkLabel: existing.replyLinkLabel ?? '',
        publicCommentReply: existing.publicCommentReply ?? '',
        publicCommentVariants: existing.publicCommentVariants,
        aiContext: existing.aiContext ?? '',
        postFilter: 'specific_post',
        specificPostId: postId,
      });
      setKeywordsText(formatKeywords(existing.triggerKeywords));
      if (postId) {
        setSelectedMedia({
          id: postId,
          kind: existing.triggerType === 'story_reply' ? 'story' : 'reel',
          thumbnailUrl: null,
          caption: null,
          permalink: null,
          likeCount: null,
          commentCount: null,
          timestamp: null,
        });
      }
      if (!postId) {
        setStep('Content');
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load automation');
    } finally {
      setLoadingExisting(false);
    }
  }, [automationId, router]);

  useEffect(() => {
    if (isEdit) void loadExisting();
  }, [isEdit, loadExisting]);

  const payload = useMemo(
    (): CreateAutomationPayload => ({
      ...form,
      name: form.name.trim(),
      postFilter: 'specific_post',
      specificPostId: form.specificPostId.trim(),
      triggerKeywords: parseKeywords(keywordsText),
      replyMessages: form.replyMessages.map((m) => m.trim()).filter(Boolean),
      replyLink: form.replyLink?.trim() || undefined,
      replyLinkLabel: form.replyLinkLabel?.trim() || undefined,
      publicCommentReply: form.publicCommentReply?.trim() || undefined,
      aiContext: form.aiContext?.trim() || undefined,
    }),
    [form, keywordsText]
  );

  const canContinueContent = Boolean(payload.specificPostId);

  const canContinueTrigger =
    payload.name.length > 0 && (payload.matchType === 'any' || payload.triggerKeywords.length > 0);

  const canContinueReply =
    payload.replyType === 'ai_generated'
      ? Boolean(payload.aiContext)
      : payload.replyMessages.length > 0;

  const selectMedia = (item: InstagramMediaItem) => {
    setSelectedMedia(item);
    const defaultTrigger = item.kind === 'story' ? 'story_reply' : 'comment_keyword';
    setForm((prev) => ({
      ...prev,
      specificPostId: item.id,
      triggerType: defaultTrigger,
      name: prev.name || `Auto DM — ${item.kind}`,
    }));
  };

  const goNext = () => {
    if (step === 'Content' && !canContinueContent) return;
    if (step === 'Trigger' && !canContinueTrigger) return;
    if (step === 'Reply' && !canContinueReply) return;
    if (step === 'Content') setStep('Trigger');
    else if (step === 'Trigger') setStep('Reply');
    else if (step === 'Reply') setStep('Review');
  };

  const goBack = () => {
    if (step === 'Trigger') {
      if (isEdit) router.back();
      else setStep('Content');
    } else if (step === 'Reply') setStep('Trigger');
    else if (step === 'Review') setStep('Reply');
    else router.back();
  };

  const runAiSuggest = async () => {
    if (!payload.specificPostId) return;
    setSuggestLoading(true);
    try {
      const { suggestion } = await instagramAutomationApi.suggestAutomation({
        mediaId: payload.specificPostId,
        triggerType: payload.triggerType,
        replyType: payload.replyType,
      });
      setKeywordsText(formatKeywords(suggestion.suggestedKeywords));
      if (suggestion.suggestedPublicCommentReply) {
        setForm((prev) => ({
          ...prev,
          publicCommentReply: suggestion.suggestedPublicCommentReply,
        }));
      }
      if (payload.replyType === 'ai_generated') {
        setForm((prev) => ({
          ...prev,
          aiContext: suggestion.suggestedAiContext,
        }));
      } else if (suggestion.suggestedReplyMessages[0]) {
        setForm((prev) => ({
          ...prev,
          replyMessages: suggestion.suggestedReplyMessages,
        }));
      }
    } catch (e) {
      Alert.alert('Suggestion failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSuggestLoading(false);
    }
  };

  const runAiPreview = async () => {
    if (!payload.aiContext) return;
    setPreviewLoading(true);
    const sample = payload.triggerKeywords[0] ?? 'Hey, can you share the link?';
    const preview = await previewAi(payload.aiContext, sample);
    setAiPreview(preview);
    setPreviewLoading(false);
  };

  const savePayload = async (replaceExisting = false) => {
    const body: CreateAutomationPayload = { ...payload, replaceExisting };
    if (isEdit && automationId) {
      await updateAutomation(automationId, body);
    } else {
      await createAutomation(body);
    }
    router.replace('/account-screens/dm-automation' as never);
  };

  const submit = async () => {
    try {
      await savePayload(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      if (message.toLowerCase().includes('already exists')) {
        Alert.alert(
          'Automation exists',
          'This content already has an active automation for this trigger. Replace it?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Replace',
              style: 'destructive',
              onPress: () => {
                void savePayload(true).catch((err) => {
                  Alert.alert('Error', err instanceof Error ? err.message : 'Save failed');
                });
              },
            },
          ]
        );
        return;
      }
      Alert.alert('Error', message);
    }
  };

  if (loadingExisting) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={shell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader
        title={isEdit ? 'Edit automation' : 'Set up Auto DM'}
        subtitle={`Step ${stepIndex + 1} of ${STEPS.length}: ${step}`}
      />

      <View style={styles.stepDots}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.dot,
              { backgroundColor: shell.borderSubtle },
              i <= stepIndex ? [styles.dotActive, { backgroundColor: shell.cta }] : null,
            ]}
          />
        ))}
      </View>

      {step === 'Content' ? (
        <PremiumCard style={styles.section}>
          <Text style={[styles.helpText, { color: shell.textSecondary }]}>
            Select the reel, post, or story you want to automate. Auto DMs only run on that content.
          </Text>
          <PremiumSegmentedControl
            segments={MEDIA_TABS.map((t) => ({ key: t.key, label: t.label }))}
            value={mediaTab}
            onChange={(key) => setMediaTab(key as MediaTab)}
            compact
          />
          <View style={styles.mediaHeader}>
            <Text style={[styles.label, { color: shell.textPrimary }]}>Select content</Text>
            <TouchableOpacity onPress={() => void loadMedia(true)} disabled={mediaLoading}>
              <Text style={[styles.refreshText, { color: shell.cta }]}>
                {mediaLoading ? 'Loading…' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
          {mediaLoading && mediaItems.length === 0 ? (
            <ActivityIndicator color={shell.cta} style={{ marginVertical: spacing.lg }} />
          ) : mediaItems.length === 0 ? (
            <Text style={[styles.emptyMedia, { color: shell.textSecondary }]}>
              No {mediaTab} found. Pull to refresh or post new content.
            </Text>
          ) : (
            <FlatList
              data={mediaItems}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.mediaRow}
              renderItem={({ item }) => {
                const selected = selectedMedia?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.mediaTile,
                      { backgroundColor: shell.canvasAlt },
                      selected ? [styles.mediaTileSelected, { borderColor: shell.cta }] : null,
                    ]}
                    onPress={() => selectMedia(item)}
                  >
                    {item.thumbnailUrl ? (
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={[styles.mediaThumb, { backgroundColor: shell.borderSubtle }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.mediaThumb,
                          styles.mediaThumbPlaceholder,
                          { backgroundColor: shell.borderSubtle },
                        ]}
                      >
                        <Text style={[styles.mediaPlaceholderText, { color: shell.textMuted }]}>
                          {item.kind}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[styles.mediaMeta, { color: shell.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.likeCount != null ? `${item.likeCount} likes` : item.kind}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </PremiumCard>
      ) : null}

      {step === 'Trigger' ? (
        <PremiumCard style={styles.section}>
          {selectedMedia ? (
            <Text style={[styles.helpText, { color: shell.textSecondary }]}>
              Target: {selectedMedia.kind} ·{' '}
              {selectedMedia.caption?.slice(0, 60) || selectedMedia.id}
            </Text>
          ) : null}
          <Text style={[styles.label, { color: shell.textPrimary }]}>Automation name</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.cardBorder,
                color: shell.textPrimary,
                backgroundColor: shell.card,
              },
            ]}
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder="e.g. Comment LINK reply"
            placeholderTextColor={shell.textMuted}
          />
          <Text style={[styles.label, { color: shell.textPrimary }]}>Trigger type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {triggerOptions.map((opt) => {
              const active = form.triggerType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.chip,
                    { backgroundColor: shell.iceBlue },
                    active && [
                      styles.chipActive,
                      { backgroundColor: shell.cta, borderColor: shell.cta },
                    ],
                  ]}
                  onPress={() => setForm({ ...form, triggerType: opt.key })}
                >
                  <Text
                    style={[styles.chipText, { color: active ? palette.white : shell.textPrimary }]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={[styles.label, { color: shell.textPrimary }]}>Match type</Text>
          <PremiumSegmentedControl
            segments={MATCH_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
            value={form.matchType}
            onChange={(matchType) => setForm({ ...form, matchType: matchType as DmMatchType })}
            compact
          />
          {form.matchType !== 'any' ? (
            <>
              <Text style={[styles.label, { color: shell.textPrimary }]}>
                Keywords (comma separated)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    borderColor: shell.cardBorder,
                    color: shell.textPrimary,
                    backgroundColor: shell.card,
                  },
                ]}
                value={keywordsText}
                onChangeText={setKeywordsText}
                placeholder="LINK, INFO, PRICE"
                placeholderTextColor={shell.textMuted}
                multiline
              />
            </>
          ) : null}
          {form.triggerType === 'comment_keyword' ? (
            <>
              <Text style={[styles.label, { color: shell.textPrimary }]}>
                Public comment reply (optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: shell.cardBorder,
                    color: shell.textPrimary,
                    backgroundColor: shell.card,
                  },
                ]}
                value={form.publicCommentReply ?? ''}
                onChangeText={(publicCommentReply) => setForm({ ...form, publicCommentReply })}
                placeholder="Check your DMs!"
                placeholderTextColor={shell.textMuted}
              />
            </>
          ) : null}
        </PremiumCard>
      ) : null}

      {step === 'Reply' ? (
        <PremiumCard style={styles.section}>
          <SecondaryButton
            label={suggestLoading ? 'Suggesting…' : 'Suggest with AI'}
            disabled={suggestLoading || !payload.specificPostId}
            onPress={() => void runAiSuggest()}
          />
          <Text style={[styles.label, { color: shell.textPrimary }]}>Reply type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {REPLY_OPTIONS.map((opt) => {
              const active = form.replyType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.chip,
                    { backgroundColor: shell.iceBlue },
                    active && [
                      styles.chipActive,
                      { backgroundColor: shell.cta, borderColor: shell.cta },
                    ],
                  ]}
                  onPress={() => setForm({ ...form, replyType: opt.key })}
                >
                  <Text
                    style={[styles.chipText, { color: active ? palette.white : shell.textPrimary }]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {form.replyType === 'ai_generated' ? (
            <>
              <Text style={[styles.label, { color: shell.textPrimary }]}>AI context</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    borderColor: shell.cardBorder,
                    color: shell.textPrimary,
                    backgroundColor: shell.card,
                  },
                ]}
                value={form.aiContext ?? ''}
                onChangeText={(aiContext) => setForm({ ...form, aiContext })}
                placeholder="Describe your brand, offer, and tone..."
                placeholderTextColor={shell.textMuted}
                multiline
              />
              <SecondaryButton
                label={previewLoading ? 'Generating...' : 'Preview AI reply'}
                disabled={previewLoading || !form.aiContext?.trim()}
                onPress={() => void runAiPreview()}
              />
              {aiPreview ? (
                <View style={[styles.previewBox, { backgroundColor: shell.canvasAlt }]}>
                  <Text style={[styles.previewLabel, { color: shell.textSecondary }]}>Preview</Text>
                  <Text style={[styles.previewText, { color: shell.textPrimary }]}>
                    {aiPreview}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: shell.textPrimary }]}>Reply message</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    borderColor: shell.cardBorder,
                    color: shell.textPrimary,
                    backgroundColor: shell.card,
                  },
                ]}
                value={form.replyMessages[0] ?? ''}
                onChangeText={(text) => setForm({ ...form, replyMessages: [text] })}
                placeholder="Thanks for reaching out!"
                placeholderTextColor={shell.textMuted}
                multiline
              />
              {form.replyType === 'text_with_link' ? (
                <>
                  <Text style={[styles.label, { color: shell.textPrimary }]}>Link URL</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: shell.cardBorder,
                        color: shell.textPrimary,
                        backgroundColor: shell.card,
                      },
                    ]}
                    value={form.replyLink ?? ''}
                    onChangeText={(replyLink) => setForm({ ...form, replyLink })}
                    placeholder="https://..."
                    placeholderTextColor={shell.textMuted}
                    autoCapitalize="none"
                  />
                  <Text style={[styles.label, { color: shell.textPrimary }]}>Link label</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: shell.cardBorder,
                        color: shell.textPrimary,
                        backgroundColor: shell.card,
                      },
                    ]}
                    value={form.replyLinkLabel ?? ''}
                    onChangeText={(replyLinkLabel) => setForm({ ...form, replyLinkLabel })}
                    placeholder="Shop now"
                    placeholderTextColor={shell.textMuted}
                  />
                </>
              ) : null}
            </>
          )}
        </PremiumCard>
      ) : null}

      {step === 'Review' ? (
        <PremiumCard style={styles.section}>
          {selectedMedia?.thumbnailUrl ? (
            <Image source={{ uri: selectedMedia.thumbnailUrl }} style={styles.reviewThumb} />
          ) : null}
          <Text style={[styles.reviewRow, { color: shell.textPrimary }]}>
            <Text style={styles.reviewLabel}>Content: </Text>
            {selectedMedia?.kind ?? 'selected'} ({payload.specificPostId.slice(0, 12)}…)
          </Text>
          <Text style={[styles.reviewRow, { color: shell.textPrimary }]}>
            <Text style={styles.reviewLabel}>Name: </Text>
            {payload.name}
          </Text>
          <Text style={[styles.reviewRow, { color: shell.textPrimary }]}>
            <Text style={styles.reviewLabel}>Trigger: </Text>
            {payload.triggerType.replace(/_/g, ' ')}
          </Text>
          <Text style={[styles.reviewRow, { color: shell.textPrimary }]}>
            <Text style={styles.reviewLabel}>Match: </Text>
            {payload.matchType}
          </Text>
          {payload.triggerKeywords.length ? (
            <Text style={[styles.reviewRow, { color: shell.textPrimary }]}>
              <Text style={styles.reviewLabel}>Keywords: </Text>
              {payload.triggerKeywords.join(', ')}
            </Text>
          ) : null}
          <Text style={[styles.reviewRow, { color: shell.textPrimary }]}>
            <Text style={styles.reviewLabel}>Reply: </Text>
            {payload.replyType.replace(/_/g, ' ')}
          </Text>
          {payload.replyType === 'ai_generated' ? (
            <Text style={[styles.reviewBody, { color: shell.textSecondary }]}>
              {payload.aiContext}
            </Text>
          ) : (
            <Text style={[styles.reviewBody, { color: shell.textSecondary }]}>
              {payload.replyMessages[0]}
            </Text>
          )}
        </PremiumCard>
      ) : null}

      <View style={styles.actions}>
        <SecondaryButton
          label={stepIndex === 0 ? 'Cancel' : 'Back'}
          onPress={() => {
            if (step === 'Trigger' && !isEdit) goBack();
            else if (step === 'Content') router.back();
            else goBack();
          }}
        />
        {step === 'Review' ? (
          <PrimaryButton
            label={isEdit ? 'Save changes' : 'Start automation'}
            onPress={() => void submit()}
            loading={isSaving}
            disabled={isSaving}
          />
        ) : (
          <PrimaryButton
            label="Continue"
            onPress={goNext}
            disabled={
              step === 'Content'
                ? !canContinueContent
                : step === 'Trigger'
                  ? !canContinueTrigger
                  : !canContinueReply
            }
          />
        )}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stepDots: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  dotActive: {},
  section: { marginBottom: spacing.md },
  helpText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  chipScroll: { marginBottom: spacing.sm, flexGrow: 0 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {},
  chipText: { fontFamily: fonts.semiBold, fontSize: 13 },
  chipTextActive: { color: palette.white },
  previewBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  previewLabel: { fontFamily: fonts.semiBold, fontSize: 12, marginBottom: 4 },
  previewText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  reviewThumb: { width: '100%', height: 180, borderRadius: radius.md, marginBottom: spacing.sm },
  reviewRow: { fontFamily: fonts.regular, fontSize: 14, marginBottom: spacing.xs },
  reviewLabel: { fontFamily: fonts.semiBold },
  reviewBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  refreshText: { fontFamily: fonts.semiBold, fontSize: 13 },
  emptyMedia: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginVertical: spacing.md,
  },
  mediaRow: { gap: spacing.sm, marginBottom: spacing.sm },
  mediaTile: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  mediaTileSelected: {},
  mediaThumb: { width: '100%', aspectRatio: 0.75 },
  mediaThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  mediaPlaceholderText: { fontFamily: fonts.semiBold, fontSize: 12 },
  mediaMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    padding: spacing.xs,
  },
});
