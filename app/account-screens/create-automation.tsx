import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
  showKollabConfirm,
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
import { useKollab, font, space, choiceChipColors } from '@/theme/kollab-tokens';

type MediaTab = 'reels' | 'posts' | 'stories';

const ALL_TRIGGER_OPTIONS: { key: DmTriggerType; label: string }[] = [
  { key: 'comment_keyword', label: 'Comment keyword' },
  { key: 'story_reply', label: 'Story reply' },
];

const MATCH_OPTIONS: { key: DmMatchType; label: string }[] = [
  { key: 'contains', label: 'Contains' },
  { key: 'exact', label: 'Exact' },
  { key: 'any', label: 'Any' },
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

const SETUP_STEPS = [
  { title: 'Content', subtitle: 'Pick a reel, post, or story' },
  { title: 'Trigger', subtitle: 'When should we reply?' },
  { title: 'Reply', subtitle: 'What should we send?' },
] as const;

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
    replyType: 'text',
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

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  kollab,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  kollab: ReturnType<typeof useKollab>;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const on = value === opt.key;
        const chip = choiceChipColors(kollab, on);
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.chip,
              {
                backgroundColor: chip.backgroundColor,
                borderColor: chip.borderColor,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: chip.color }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CreateAutomationScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const { automationId } = useLocalSearchParams<{ automationId?: string }>();
  const isEdit = Boolean(automationId);
  const { createAutomation, updateAutomation, isSaving } = useInstagramAutomationStore();

  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [form, setForm] = useState<CreateAutomationPayload>(defaultForm());
  const [keywordsText, setKeywordsText] = useState('');
  const [mediaTab, setMediaTab] = useState<MediaTab>('reels');
  const [mediaItems, setMediaItems] = useState<InstagramMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<InstagramMediaItem | null>(null);
  const [step, setStep] = useState(0);

  const triggerOptions = useMemo(() => triggerOptionsForMedia(selectedMedia), [selectedMedia]);

  const loadMedia = useCallback(
    async (refresh = false) => {
      setMediaLoading(true);
      try {
        const res = await instagramAutomationApi.listMedia(mediaTab, { refresh });
        setMediaItems(res.items);
      } catch (e) {
        showKollabToast(e instanceof Error ? e.message : 'Could not load content');
      } finally {
        setMediaLoading(false);
      }
    },
    [mediaTab]
  );

  useEffect(() => {
    void loadMedia(false);
  }, [loadMedia]);

  const loadExisting = useCallback(async () => {
    if (!automationId) return;
    setLoadingExisting(true);
    try {
      const res = await instagramAutomationApi.getAutomations();
      const existing = res.automations.find((a) => a.id === automationId);
      if (!existing) {
        showKollabToast('Automation could not be loaded.');
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
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Failed to load automation');
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

  const savePayload = async (replaceExisting = false) => {
    const body: CreateAutomationPayload = { ...payload, replaceExisting };
    if (isEdit && automationId) {
      await updateAutomation(automationId, body);
    } else {
      await createAutomation(body);
    }
    router.replace('/account-screens/dm-automation' as never);
  };

  const goNext = () => {
    if (step === 0 && !payload.specificPostId) {
      showKollabToast('Pick a reel, post, or story to automate.');
      return;
    }
    if (step === 1) {
      if (!payload.name) {
        showKollabToast('Give this automation a name.');
        return;
      }
      if (payload.matchType !== 'any' && payload.triggerKeywords.length === 0) {
        showKollabToast('Add at least one keyword.');
        return;
      }
    }
    if (step < SETUP_STEPS.length - 1) setStep((n) => n + 1);
  };

  const submit = async () => {
    if (!payload.specificPostId) {
      showKollabToast('Pick a reel, post, or story to automate.');
      return;
    }
    if (!payload.name) {
      showKollabToast('Give this automation a name.');
      return;
    }
    if (payload.matchType !== 'any' && payload.triggerKeywords.length === 0) {
      showKollabToast('Add at least one keyword.');
      return;
    }
    const hasReply =
      payload.replyType === 'ai_generated'
        ? Boolean(payload.aiContext)
        : payload.replyMessages.length > 0;
    if (!hasReply) {
      showKollabToast('Add a reply message.');
      return;
    }
    try {
      await savePayload(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      if (message.toLowerCase().includes('already exists')) {
        void showKollabConfirm({
          title: 'Automation exists',
          message: 'This content already has an active automation for this trigger. Replace it?',
          confirmLabel: 'Replace',
          destructive: true,
        }).then((ok) => {
          if (!ok) return;
          void savePayload(true).catch((err) => {
            showKollabToast(err instanceof Error ? err.message : 'Save failed');
          });
        });
        return;
      }
      showKollabToast(message);
    }
  };

  if (loadingExisting) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
      <KollabScreenHeader
        title={isEdit ? 'Edit automation' : 'New automation'}
        subtitle={`${SETUP_STEPS[step].title} · step ${step + 1} of ${SETUP_STEPS.length}`}
        backTone="well"
      />

      <View style={styles.stepper}>
        {SETUP_STEPS.map((item, index) => {
          const on = index === step;
          const done = index < step;
          return (
            <Pressable
              key={item.title}
              onPress={() => {
                if (index < step) setStep(index);
              }}
              style={styles.stepItem}
            >
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: on || done ? kollab.color.panel : kollab.color.well,
                    borderColor: on ? kollab.color.chartreuse : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNum,
                    { color: on || done ? kollab.color.chartreuse : kollab.color.ink },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[styles.stepLabel, { color: kollab.color.ink, opacity: on ? 1 : 0.45 }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.stepIntro, { color: kollab.color.ink }]}>
        {SETUP_STEPS[step].subtitle}
      </Text>

      {step === 0 ? (
        <>
          <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Content</Text>
          <View style={styles.chipRow}>
            {MEDIA_TABS.map((t) => {
              const on = mediaTab === t.key;
              const chip = choiceChipColors(kollab, on);
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setMediaTab(t.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: chip.backgroundColor,
                      borderColor: chip.borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: chip.color }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {mediaLoading && mediaItems.length === 0 ? (
            <ActivityIndicator color={kollab.color.ink} style={{ marginBottom: 16 }} />
          ) : (
            <View style={styles.mediaRow}>
              {mediaItems.slice(0, 6).map((item) => {
                const selected = selectedMedia?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => selectMedia(item)}
                    style={[
                      styles.mediaTile,
                      {
                        backgroundColor: kollab.color.imgBg,
                        borderColor: selected ? kollab.color.chartreuse : 'transparent',
                      },
                    ]}
                  >
                    {item.thumbnailUrl ? (
                      <Image source={{ uri: item.thumbnailUrl }} style={styles.mediaThumb} />
                    ) : (
                      <View style={styles.mediaThumb} />
                    )}
                    {selected ? (
                      <View style={[styles.check, { backgroundColor: kollab.color.chartreuse }]}>
                        <Text style={[styles.checkMark, { color: kollab.color.onChartreuse }]}>
                          ✓
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Automation name</Text>
          <KollabTextField
            surface="well"
            placeholder="e.g. Comment LINK reply"
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            style={styles.field}
          />

          <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Trigger type</Text>
          <ChipRow
            options={triggerOptions}
            value={form.triggerType}
            onChange={(triggerType) => setForm({ ...form, triggerType })}
            kollab={kollab}
          />

          <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Match</Text>
          <ChipRow
            options={MATCH_OPTIONS}
            value={form.matchType}
            onChange={(matchType) => setForm({ ...form, matchType })}
            kollab={kollab}
          />

          {form.matchType !== 'any' ? (
            <>
              <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Keywords</Text>
              <KollabTextField
                surface="well"
                placeholder="LINK, INFO, PRICE"
                value={keywordsText}
                onChangeText={setKeywordsText}
                style={styles.field}
              />
            </>
          ) : null}

          {form.triggerType === 'comment_keyword' ? (
            <>
              <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>
                Public comment reply
              </Text>
              <KollabTextField
                surface="well"
                placeholder="Check your DMs!"
                value={form.publicCommentReply ?? ''}
                onChangeText={(publicCommentReply) => setForm({ ...form, publicCommentReply })}
                style={styles.field}
              />
            </>
          ) : null}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Reply type</Text>
          <ChipRow
            options={REPLY_OPTIONS}
            value={form.replyType}
            onChange={(replyType) => setForm({ ...form, replyType })}
            kollab={kollab}
          />

          {form.replyType === 'ai_generated' ? (
            <>
              <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>AI context</Text>
              <KollabTextField
                surface="well"
                multiline
                placeholder="Describe your brand, offer, and tone..."
                value={form.aiContext ?? ''}
                onChangeText={(aiContext) => setForm({ ...form, aiContext })}
                style={styles.field}
              />
            </>
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Reply message</Text>
              <KollabTextField
                surface="well"
                multiline
                placeholder="Thanks for reaching out!"
                value={form.replyMessages[0] ?? ''}
                onChangeText={(text) => setForm({ ...form, replyMessages: [text] })}
                style={styles.field}
              />
            </>
          )}

          <View style={styles.linkRow}>
            <KollabTextField
              surface="well"
              placeholder="https://..."
              value={form.replyLink ?? ''}
              onChangeText={(replyLink) =>
                setForm({
                  ...form,
                  replyLink,
                  replyType:
                    form.replyType === 'text' && replyLink ? 'text_with_link' : form.replyType,
                })
              }
              autoCapitalize="none"
              style={styles.linkUrl}
            />
            <KollabTextField
              surface="well"
              placeholder="Shop now"
              value={form.replyLinkLabel ?? ''}
              onChangeText={(replyLinkLabel) => setForm({ ...form, replyLinkLabel })}
              style={styles.linkLabel}
            />
          </View>
        </>
      ) : null}

      <View style={styles.navRow}>
        {step > 0 ? (
          <KollabButton
            label="Previous"
            variant="soft"
            onPress={() => setStep((n) => Math.max(0, n - 1))}
            style={styles.navBtn}
          />
        ) : null}
        {step < SETUP_STEPS.length - 1 ? (
          <KollabButton label="Next" variant="ink" onPress={goNext} style={styles.navBtn} />
        ) : (
          <KollabButton
            label={isSaving ? 'Saving…' : isEdit ? 'Save' : 'Create automation'}
            variant="ink"
            onPress={() => void submit()}
            disabled={isSaving}
            style={styles.navBtn}
          />
        )}
      </View>
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
  field: { marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  mediaTile: {
    width: 96,
    height: 132,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
  },
  mediaThumb: { width: 96, height: 132 },
  check: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 22,
    height: 22,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 12, fontFamily: font.bold },
  linkRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  linkUrl: { flex: 1, minWidth: 0 },
  linkLabel: { width: 110 },
  stepper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 99,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontFamily: font.bold, fontSize: 12 },
  stepLabel: { fontFamily: font.semiBold, fontSize: 11.5 },
  stepIntro: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    marginBottom: 16,
  },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 },
  navBtn: { flex: 1 },
});
