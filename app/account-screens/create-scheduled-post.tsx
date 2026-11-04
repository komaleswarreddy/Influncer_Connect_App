import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { schedulerApi } from '@/lib/scheduler-api';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
} from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { SchedulerContentType, SchedulerMediaType } from '@/lib/scheduler-api';
import ScheduleDateTimeSheet, {
  dateToScheduleValue,
  formatScheduleWhen,
  scheduleValueToDate,
  type ScheduleDateTimeValue,
} from '@/components/scheduler/ScheduleDateTimeSheet';
import { useKollab, font, space, choiceChipColors, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import DmAutomationDraftForm, {
  defaultDmAutomationDraft,
  keywordsToText,
  parseKeywords,
} from '@/components/scheduler/DmAutomationDraftForm';
import type { DmAutomationDraft } from '@/lib/scheduler-api';

const CONTENT_TABS: { key: SchedulerContentType; label: string }[] = [
  { key: 'reel', label: 'Reel' },
  { key: 'post', label: 'Post' },
  { key: 'story', label: 'Story' },
];

const MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000;

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export default function CreateScheduledPostScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const params = useLocalSearchParams<{
    postId?: string;
    appliedCaption?: string;
    appliedHashtags?: string;
    topic?: string;
  }>();

  const { uploadMedia, createPost, updatePost, isSaving, generateCaptions } = useSchedulerStore();
  const [contentType, setContentType] = useState<SchedulerContentType>('reel');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<SchedulerMediaType>('video');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [scheduleValue, setScheduleValue] = useState<ScheduleDateTimeValue>(() =>
    dateToScheduleValue(
      (() => {
        const d = addDays(startOfDay(new Date()), 1);
        d.setHours(15, 0, 0, 0);
        return d;
      })()
    )
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [dmEnabled, setDmEnabled] = useState(false);
  const [dmDraft, setDmDraft] = useState<DmAutomationDraft>(defaultDmAutomationDraft());
  const [dmKeywordsText, setDmKeywordsText] = useState('');

  const editingId = typeof params.postId === 'string' ? params.postId : undefined;
  const tz = deviceTimezone();

  // Fresh navigation into this screen with an applied caption (e.g. from
  // trending-ideas.tsx) — runs once on mount via route params.
  useEffect(() => {
    if (params.appliedCaption) setCaption(String(params.appliedCaption));
    if (params.appliedHashtags) setHashtags(String(params.appliedHashtags));
    if (params.topic) setAiTopic(String(params.topic));
  }, [params.appliedCaption, params.appliedHashtags, params.topic]);

  // Returning here from ai-caption-results via router.back() — the same
  // screen instance regains focus (uploaded media/schedule state intact),
  // so pick up the chosen caption from the store instead of route params.
  useFocusEffect(
    useCallback(() => {
      const pending = useSchedulerStore.getState().pendingAppliedCaption;
      if (pending) {
        setCaption(pending.caption);
        if (pending.hashtags) setHashtags(pending.hashtags);
        useSchedulerStore.getState().setPendingAppliedCaption(null);
      }
    }, [])
  );

  useEffect(() => {
    if (!editingId) return;
    void (async () => {
      try {
        const loaded = await schedulerApi.getPost(editingId);
        setContentType(loaded.contentType);
        setMediaUrl(loaded.mediaUrl);
        setMediaType(loaded.mediaType);
        setThumbnailUrl(loaded.thumbnailUrl);
        setCaption(loaded.caption || '');
        setHashtags(loaded.hashtags || '');
        setScheduleValue(dateToScheduleValue(new Date(loaded.scheduledAt)));
        if (loaded.dmAutomation && loaded.status === 'scheduled') {
          setDmEnabled(true);
          setDmDraft({
            name: loaded.dmAutomation.name,
            triggerKeywords: loaded.dmAutomation.triggerKeywords,
            matchType: loaded.dmAutomation.matchType,
            replyType: loaded.dmAutomation.replyType,
            replyMessages: loaded.dmAutomation.replyMessages.length
              ? loaded.dmAutomation.replyMessages
              : [''],
            replyLink: loaded.dmAutomation.replyLink || '',
            replyLinkLabel: loaded.dmAutomation.replyLinkLabel || '',
            publicCommentReply: loaded.dmAutomation.publicCommentReply || '',
            aiContext: loaded.dmAutomation.aiContext || '',
          });
          setDmKeywordsText(keywordsToText(loaded.dmAutomation.triggerKeywords));
        } else {
          setDmEnabled(false);
          setDmDraft(defaultDmAutomationDraft());
          setDmKeywordsText('');
        }
      } catch {
        showKollabToast('Could not load post for editing');
      }
    })();
  }, [editingId]);

  const scheduledAtIso = useMemo(
    () => scheduleValueToDate(scheduleValue).toISOString(),
    [scheduleValue]
  );
  const scheduleLabel = useMemo(() => formatScheduleWhen(scheduleValue, tz), [scheduleValue, tz]);

  const pickMedia = async () => {
    let uri: string | undefined;
    let mime = 'image/jpeg';
    let name = 'upload.jpg';
    let pickedType: SchedulerMediaType = 'image';

    if (contentType === 'reel') {
      const doc = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });
      if (doc.canceled || !doc.assets?.[0]) return;
      uri = doc.assets[0].uri;
      mime = doc.assets[0].mimeType || 'video/mp4';
      name = doc.assets[0].name || 'upload.mp4';
      pickedType = 'video';
    } else {
      const picker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          contentType === 'story'
            ? ImagePicker.MediaTypeOptions.All
            : ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (picker.canceled || !picker.assets?.[0]) return;
      uri = picker.assets[0].uri;
      mime =
        picker.assets[0].mimeType ||
        (picker.assets[0].type === 'video' ? 'video/mp4' : 'image/jpeg');
      name =
        picker.assets[0].fileName ||
        (picker.assets[0].type === 'video' ? 'upload.mp4' : 'upload.jpg');
      pickedType = picker.assets[0].type === 'video' ? 'video' : 'image';
    }

    if (!uri) return;

    try {
      const result = await uploadMedia({ uri, name, type: mime });
      setMediaUrl(result.mediaUrl);
      setMediaType(result.mediaType || pickedType);
      setThumbnailUrl(result.thumbnailUrl);
    } catch (err) {
      showKollabToast(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const applyScheduleValue = (next: ScheduleDateTimeValue) => {
    setScheduleValue(next);
  };

  const askAi = async () => {
    const topic = aiTopic.trim() || caption.trim() || 'Instagram content';
    try {
      await generateCaptions(topic, contentType);
      router.push({
        pathname: '/account-screens/ai-caption-results' as never,
        params: { returnTo: '/account-screens/create-scheduled-post', topic },
      } as never);
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Caption generation failed');
    }
  };

  const submit = async () => {
    if (!mediaUrl) {
      showKollabToast('Upload a reel, image, or story first.');
      return;
    }
    const when = scheduleValueToDate(scheduleValue);
    if (when.getTime() < Date.now() + MIN_SCHEDULE_LEAD_MS) {
      showKollabToast('Pick a time at least 10 minutes from now.');
      return;
    }
    if (dmEnabled) {
      const keywords = parseKeywords(dmKeywordsText);
      const trimmedName = dmDraft.name.trim();
      const hasReply =
        dmDraft.replyType === 'ai_generated'
          ? Boolean(dmDraft.aiContext?.trim())
          : Boolean(dmDraft.replyMessages.map((m) => m.trim()).filter(Boolean).length);
      if (!trimmedName || (dmDraft.matchType !== 'any' && keywords.length === 0) || !hasReply) {
        showKollabToast('Fill in the DM automation name, keywords, and reply.');
        return;
      }
      if (dmDraft.replyType === 'text_with_link' && !dmDraft.replyLink?.trim()) {
        showKollabToast('Add a link URL for text + link replies.');
        return;
      }
    }

    try {
      const payload = {
        contentType,
        mediaUrl,
        mediaType,
        thumbnailUrl: thumbnailUrl || undefined,
        caption: caption.trim() || undefined,
        hashtags: hashtags.trim() || undefined,
        scheduledAt: scheduledAtIso,
        timezone: tz,
        ...(dmEnabled
          ? {
              dmAutomation: {
                ...dmDraft,
                name: dmDraft.name.trim(),
                triggerKeywords: parseKeywords(dmKeywordsText),
                replyMessages: dmDraft.replyMessages.map((m) => m.trim()).filter(Boolean),
                replyLink: dmDraft.replyLink?.trim() || undefined,
                replyLinkLabel: dmDraft.replyLinkLabel?.trim() || undefined,
                ...(contentType === 'story'
                  ? {}
                  : {
                      publicCommentReply: dmDraft.publicCommentReply?.trim() || undefined,
                    }),
                aiContext: dmDraft.aiContext?.trim() || undefined,
              },
            }
          : editingId && !dmEnabled
            ? { removeDmAutomation: true }
            : {}),
      };
      if (editingId) await updatePost(editingId, payload);
      else await createPost(payload);
      setSuccessOpen(true);
    } catch (err) {
      showKollabToast(err instanceof Error ? err.message : 'Schedule failed');
    }
  };

  const thumbUri = thumbnailUrl || mediaUrl;

  return (
    <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
      <KollabScreenHeader
        title={editingId ? 'Edit schedule' : 'Schedule content'}
        subtitle="Reels, posts, and stories"
        backTone="well"
      />

      <View style={styles.chipRow}>
        {CONTENT_TABS.map((tab) => {
          const on = contentType === tab.key;
          const chip = choiceChipColors(kollab, on);
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                setContentType(tab.key);
                if (tab.key === 'story' && dmEnabled) {
                  setDmDraft((prev) => ({ ...prev, publicCommentReply: '' }));
                }
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: chip.backgroundColor,
                  borderColor: chip.borderColor,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: chip.color }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>
        Media <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <View style={styles.mediaRow}>
        {thumbUri ? (
          <View
            style={[
              styles.thumbWrap,
              { backgroundColor: kollab.color.imgBg, borderColor: kollab.color.chartreuse },
            ]}
          >
            <Image source={{ uri: thumbUri }} style={styles.thumb} />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)', 'rgba(11,9,6,0.6)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.dur, { backgroundColor: kollab.color.panel }]}>
              <Text style={[styles.durText, { color: kollab.color.panelInk }]}>
                {mediaType === 'video' ? 'Reel' : contentType === 'story' ? 'Story' : 'Post'}
              </Text>
            </View>
            <View style={[styles.check, { backgroundColor: kollab.color.chartreuse }]}>
              <Text style={[styles.checkMark, { color: kollab.color.onChartreuse }]}>✓</Text>
            </View>
          </View>
        ) : null}
        <Pressable
          onPress={() => void pickMedia()}
          style={[
            styles.dashed,
            { backgroundColor: kollab.color.well, borderColor: kollab.color.outline },
          ]}
        >
          <View style={[styles.plus, { backgroundColor: kollab.color.chartreuse }]}>
            <Text style={[styles.plusGlyph, { color: kollab.color.onChartreuse }]}>+</Text>
          </View>
          <Text style={[styles.dashedLabel, { color: kollab.color.ink }]}>Choose media</Text>
        </Pressable>
      </View>

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Caption</Text>
      <KollabTextField
        surface="well"
        multiline
        value={caption}
        onChangeText={setCaption}
        placeholder="Write a caption"
        style={styles.caption}
      />
      <KollabButton
        label="Ask the AI"
        variant="soft"
        compact
        onPress={() => void askAi()}
        style={styles.askAi}
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Hashtags</Text>
      <KollabTextField
        surface="well"
        value={hashtags}
        onChangeText={setHashtags}
        placeholder="#creator #brand"
        style={styles.hashtags}
      />

      <View style={[styles.publishWell, { backgroundColor: kollab.color.well }]}>
        <View style={styles.publishCopy}>
          <Text style={[styles.publishEyebrow, { color: kollab.color.ink }]}>publish at</Text>
          <Text style={[styles.publishWhen, { color: kollab.color.ink }]}>{scheduleLabel}</Text>
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          style={[styles.changeBtn, { backgroundColor: kollab.color.card }]}
        >
          <Text style={[styles.changeText, { color: kollab.color.ink }]}>Change</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setDmEnabled((v) => !v)} style={styles.dmToggle}>
        <Text style={[styles.fieldLabel, { color: kollab.color.ink, marginBottom: 0 }]}>
          DM Automation (optional)
        </Text>
        <Text style={[styles.dmMark, { color: kollab.color.ink }]}>{dmEnabled ? '−' : '+'}</Text>
      </Pressable>
      {dmEnabled ? (
        <DmAutomationDraftForm
          variant={contentType === 'story' ? 'story' : 'post'}
          value={dmDraft}
          keywordsText={dmKeywordsText}
          onChange={setDmDraft}
          onKeywordsTextChange={setDmKeywordsText}
        />
      ) : null}

      <KollabButton
        label={isSaving ? 'Scheduling…' : 'Schedule'}
        variant="ink"
        onPress={() => void submit()}
        disabled={isSaving}
        style={styles.scheduleBtn}
      />

      <ScheduleDateTimeSheet
        visible={sheetOpen}
        value={scheduleValue}
        onClose={() => setSheetOpen(false)}
        onConfirm={applyScheduleValue}
      />

      <Modal visible={successOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
          >
            <Text style={[styles.modalTitle, { color: kollab.color.ink }]}>Scheduled</Text>
            <Text style={[styles.modalBody, { color: kollab.color.ink }]}>
              Your content is queued and will publish at the selected time.
            </Text>
            <KollabButton
              label="View calendar"
              onPress={() => {
                setSuccessOpen(false);
                router.replace('/account-screens/scheduled-calendar' as never);
              }}
            />
            <KollabButton
              label="Done"
              variant="soft"
              onPress={() => {
                setSuccessOpen(false);
                router.back();
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

function useKollabStyles(_kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
        chip: {
          borderWidth: 1.5,
          borderRadius: 999,
          paddingVertical: 9,
          paddingHorizontal: 15,
        },
        chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
        fieldLabel: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
          opacity: 0.62,
          marginBottom: 7,
        },
        mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
        thumbWrap: {
          width: 96,
          height: 132,
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 2.5,
        },
        thumb: { width: 96, height: 132 },
        dur: {
          position: 'absolute',
          left: 7,
          bottom: 7,
          borderRadius: 99,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        durText: { fontFamily: font.bold, fontSize: 10.5 },
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
        dashed: {
          flex: 1,
          minHeight: 132,
          borderRadius: 18,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
        },
        plus: {
          width: 30,
          height: 30,
          borderRadius: 99,
          alignItems: 'center',
          justifyContent: 'center',
        },
        plusGlyph: { fontSize: 16, fontFamily: font.semiBold },
        dashedLabel: { fontFamily: font.semiBold, fontSize: 11, opacity: 0.65 },
        caption: { marginBottom: 10 },
        askAi: { alignSelf: 'flex-start', marginBottom: 18, paddingHorizontal: 16 },
        hashtags: { marginBottom: 18 },
        publishWell: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 18,
          paddingVertical: 15,
          paddingHorizontal: 16,
          marginBottom: 20,
        },
        publishCopy: { flex: 1 },
        publishEyebrow: { fontFamily: font.body, fontSize: 11.5, opacity: 0.55 },
        publishWhen: { ...kType.rowTitle, marginTop: 1 },
        changeBtn: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 15 },
        changeText: { fontFamily: font.bold, fontSize: 12 },
        dmToggle: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        dmMark: { fontSize: 18, opacity: 0.4 },
        scheduleBtn: { marginTop: 8, marginBottom: 20 },
        modalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: space.lg,
        },
        modalCard: {
          width: '88%',
          maxWidth: 400,
          borderRadius: 22,
          padding: 22,
          gap: 12,
        },
        modalTitle: { ...kType.sectionTitle, textAlign: 'center' },
        modalBody: {
          fontFamily: font.body,
          fontSize: 13,
          opacity: 0.55,
          textAlign: 'center',
          marginBottom: 4,
        },
      }),
    []
  );
}
