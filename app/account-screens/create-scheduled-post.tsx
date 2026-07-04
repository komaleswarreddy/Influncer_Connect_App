import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { schedulerApi } from '@/lib/scheduler-api';
import { Ionicons } from '@expo/vector-icons';
import { ScrollScreen, SectionHeader, PremiumCard, PrimaryButton, SecondaryButton, VideoPreview } from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { SchedulerContentType, SchedulerMediaType } from '@/lib/scheduler-api';
import ScheduleDateTimeSheet, {
  dateToScheduleValue,
  formatScheduleWhen,
  scheduleValueToDate,
  type ScheduleDateTimeValue,
} from '@/components/scheduler/ScheduleDateTimeSheet';
import { appShell, spacing, radius, palette } from '@/theme';
import { fonts } from '@/components/ui/typography';
import DmAutomationDraftForm, {
  defaultDmAutomationDraft,
  keywordsToText,
  parseKeywords,
} from '@/components/scheduler/DmAutomationDraftForm';
import type { DmAutomationDraft } from '@/lib/scheduler-api';

const CONTENT_TABS: { key: SchedulerContentType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'reel', label: 'Reel', icon: 'film-outline' },
  { key: 'post', label: 'Post', icon: 'image-outline' },
  { key: 'story', label: 'Story', icon: 'ellipse-outline' },
];

const DAY_CHIPS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'custom', label: 'Custom' },
] as const;

const TIME_PRESETS = [9, 12, 15, 18, 21];
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
  const [dayChip, setDayChip] = useState<(typeof DAY_CHIPS)[number]['key']>('tomorrow');
  const [scheduleValue, setScheduleValue] = useState<ScheduleDateTimeValue>(() =>
    dateToScheduleValue((() => {
      const d = addDays(startOfDay(new Date()), 1);
      d.setHours(15, 0, 0, 0);
      return d;
    })())
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [dmEnabled, setDmEnabled] = useState(false);
  const [dmDraft, setDmDraft] = useState<DmAutomationDraft>(defaultDmAutomationDraft());
  const [dmKeywordsText, setDmKeywordsText] = useState('');

  const editingId = typeof params.postId === 'string' ? params.postId : undefined;
  const tz = deviceTimezone();

  useEffect(() => {
    if (params.appliedCaption) setCaption(String(params.appliedCaption));
    if (params.appliedHashtags) setHashtags(String(params.appliedHashtags));
    if (params.topic) setAiTopic(String(params.topic));
  }, [params.appliedCaption, params.appliedHashtags, params.topic]);

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
        setDayChip('custom');
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
        Alert.alert('Error', 'Could not load post for editing');
      }
    })();
  }, [editingId]);

  const scheduledAtIso = useMemo(() => scheduleValueToDate(scheduleValue).toISOString(), [scheduleValue]);
  const scheduleLabel = useMemo(() => formatScheduleWhen(scheduleValue, tz), [scheduleValue, tz]);

  const pickMedia = async () => {
    let uri: string | undefined;
    let mime = 'image/jpeg';
    let name = 'upload.jpg';
    let pickedType: SchedulerMediaType = 'image';

    if (contentType === 'reel') {
      const doc = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
      if (doc.canceled || !doc.assets?.[0]) return;
      uri = doc.assets[0].uri;
      mime = doc.assets[0].mimeType || 'video/mp4';
      name = doc.assets[0].name || 'upload.mp4';
      pickedType = 'video';
    } else {
      const picker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          contentType === 'story' ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (picker.canceled || !picker.assets?.[0]) return;
      uri = picker.assets[0].uri;
      mime = picker.assets[0].mimeType || (picker.assets[0].type === 'video' ? 'video/mp4' : 'image/jpeg');
      name = picker.assets[0].fileName || (picker.assets[0].type === 'video' ? 'upload.mp4' : 'upload.jpg');
      pickedType = picker.assets[0].type === 'video' ? 'video' : 'image';
    }

    if (!uri) return;

    try {
      const result = await uploadMedia({ uri, name, type: mime });
      setMediaUrl(result.mediaUrl);
      setMediaType(result.mediaType || pickedType);
      setThumbnailUrl(result.thumbnailUrl);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  const applyScheduleValue = (next: ScheduleDateTimeValue) => {
    setScheduleValue(next);
    setDayChip('custom');
  };

  const onDayChip = (key: (typeof DAY_CHIPS)[number]['key']) => {
    setDayChip(key);
    if (key === 'today') {
      const d = new Date();
      d.setMinutes(0, 0, 0);
      if (d.getTime() < Date.now()) d.setHours(d.getHours() + 1);
      applyScheduleValue(dateToScheduleValue(d));
      return;
    }
    if (key === 'tomorrow') {
      const d = addDays(startOfDay(new Date()), 1);
      d.setHours(scheduleValue.hour24, scheduleValue.minute, 0, 0);
      applyScheduleValue(dateToScheduleValue(d));
      return;
    }
    setSheetOpen(true);
  };

  const onTimePreset = (hour: number) => {
    const d = scheduleValueToDate(scheduleValue);
    d.setHours(hour, 0, 0, 0);
    applyScheduleValue(dateToScheduleValue(d));
  };

  const submit = async () => {
    if (!mediaUrl) {
      Alert.alert('Media required', 'Upload a reel, image, or story first.');
      return;
    }
    const when = scheduleValueToDate(scheduleValue);
    if (when.getTime() < Date.now() + MIN_SCHEDULE_LEAD_MS) {
      Alert.alert('Too soon', 'Pick a time at least 10 minutes from now.');
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
        Alert.alert('DM automation incomplete', 'Fill in the DM automation name, keywords, and reply.');
        return;
      }
      if (dmDraft.replyType === 'text_with_link' && !dmDraft.replyLink?.trim()) {
        Alert.alert('DM automation incomplete', 'Add a link URL for text + link replies.');
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
      Alert.alert('Schedule failed', err instanceof Error ? err.message : 'Try again');
    }
  };

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title={editingId ? 'Edit schedule' : 'Schedule content'} subtitle="Reels, posts, and stories" />

      <View style={styles.tabRow}>
        {CONTENT_TABS.map((tab) => {
          const active = contentType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                const next = tab.key;
                setContentType(next);
                if (next === 'story' && dmEnabled) {
                  setDmDraft((prev) => ({ ...prev, publicCommentReply: '' }));
                }
              }}
            >
              <Ionicons name={tab.icon} size={16} color={active ? palette.white : appShell.textMuted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PremiumCard style={styles.mediaCard}>
        {mediaUrl ? (
          mediaType === 'video' ? (
            <VideoPreview uri={mediaUrl} thumbnailUri={thumbnailUrl} aspectRatio={9 / 16} />
          ) : (
            <Image source={{ uri: thumbnailUrl || mediaUrl }} style={styles.preview} />
          )
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="cloud-upload-outline" size={32} color={appShell.textMuted} />
            <Text style={styles.previewHint}>Tap below to choose media</Text>
          </View>
        )}
        <SecondaryButton label="Choose media" onPress={() => void pickMedia()} />
      </PremiumCard>

      <PremiumCard style={styles.fieldCard}>
        <Text style={styles.label}>AI topic</Text>
        <TextInput
          style={styles.captionInput}
          value={aiTopic}
          onChangeText={setAiTopic}
          placeholder="What should the caption be about?"
          placeholderTextColor={appShell.textMuted}
        />
        <SecondaryButton
          label="Ask the AI"
          onPress={async () => {
            const topic = aiTopic.trim() || caption.trim() || 'Instagram content';
            try {
              await generateCaptions(topic, contentType);
              router.push({
                pathname: '/account-screens/ai-caption-results' as never,
                params: { returnTo: '/account-screens/create-scheduled-post' },
              } as never);
            } catch (e) {
              Alert.alert('AI captions', e instanceof Error ? e.message : 'Generation failed');
            }
          }}
        />
        <Text style={[styles.label, { marginTop: spacing.sm }]}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          multiline
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption"
          placeholderTextColor={appShell.textMuted}
        />
        <Text style={styles.label}>Hashtags</Text>
        <TextInput
          style={styles.hashtagInput}
          value={hashtags}
          onChangeText={setHashtags}
          placeholder="#creator #brand"
          placeholderTextColor={appShell.textMuted}
        />
      </PremiumCard>

            <PremiumCard style={styles.fieldCard}>
        <TouchableOpacity
          style={styles.dmToggleRow}
          activeOpacity={0.85}
          onPress={() => setDmEnabled((v) => !v)}
        >
          <View style={styles.dmToggleCopy}>
            <Text style={styles.label}>DM Automation (optional)</Text>
            <Text style={styles.dmHint}>
              {contentType === 'story'
                ? 'Auto-reply when someone replies to your story with your keyword.'
                : 'Auto-reply when someone comments with your keyword.'}
            </Text>
          </View>
          <Ionicons
            name={dmEnabled ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={20}
            color={appShell.textMuted}
          />
        </TouchableOpacity>
        {dmEnabled ? (
          <DmAutomationDraftForm
            variant={contentType === 'story' ? 'story' : 'post'}
            value={dmDraft}
            keywordsText={dmKeywordsText}
            onChange={setDmDraft}
            onKeywordsTextChange={setDmKeywordsText}
          />
        ) : null}
      </PremiumCard>

      <PremiumCard style={styles.fieldCard}>
        <Text style={styles.label}>When to publish</Text>
        <View style={styles.chipRow}>
          {DAY_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.key}
              style={[styles.dayChip, dayChip === chip.key && styles.dayChipActive]}
              onPress={() => onDayChip(chip.key)}
            >
              <Text style={[styles.dayChipText, dayChip === chip.key && styles.dayChipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.timeRow} activeOpacity={0.85} onPress={() => setSheetOpen(true)}>
          <Ionicons name="calendar-outline" size={18} color={appShell.cta} />
          <Text style={styles.timeText}>{scheduleLabel}</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={appShell.textMuted} />
        </TouchableOpacity>
        <View style={styles.chipRow}>
          {TIME_PRESETS.map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.dayChip,
                scheduleValue.hour24 === hour && scheduleValue.minute === 0 && styles.dayChipActive,
              ]}
              onPress={() => onTimePreset(hour)}
            >
              <Text
                style={[
                  styles.dayChipText,
                  scheduleValue.hour24 === hour && scheduleValue.minute === 0 && styles.dayChipTextActive,
                ]}
              >
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </PremiumCard>

      <PrimaryButton label="Schedule" onPress={() => void submit()} loading={isSaving} />

      <ScheduleDateTimeSheet
        visible={sheetOpen}
        value={scheduleValue}
        onClose={() => setSheetOpen(false)}
        onConfirm={applyScheduleValue}
      />

      <Modal visible={successOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <PremiumCard style={styles.modalCard}>
            <View style={styles.modalSuccess}>
              <Ionicons name="checkmark-circle-outline" size={36} color={appShell.cta} />
              <Text style={styles.modalTitle}>Scheduled</Text>
              <Text style={styles.modalBody}>Your content is queued and will publish at the selected time.</Text>
            </View>
            <View style={styles.modalActions}>
              <PrimaryButton
                label="View calendar"
                onPress={() => {
                  setSuccessOpen(false);
                  router.replace('/account-screens/scheduled-calendar' as never);
                }}
              />
              <SecondaryButton
                label="Done"
                onPress={() => {
                  setSuccessOpen(false);
                  router.back();
                }}
              />
            </View>
          </PremiumCard>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
  },
  tabActive: { backgroundColor: appShell.cta },
  tabText: { fontFamily: fonts.semiBold, fontSize: 13, color: appShell.textMuted },
  tabTextActive: { color: palette.white },
  mediaCard: { gap: spacing.sm, marginBottom: spacing.sm },
  preview: { width: '100%', height: 200, borderRadius: radius.md },
  previewPlaceholder: {
    height: 200,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  previewHint: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted },
  fieldCard: { gap: spacing.xs, marginBottom: spacing.sm },
  dmToggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dmToggleCopy: { flex: 1, gap: 2 },
  dmHint: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textMuted },
  label: { fontFamily: fonts.semiBold, fontSize: 13, color: appShell.textPrimary },
  captionInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    color: appShell.textPrimary,
    textAlignVertical: 'top',
  },
  hashtagInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    color: appShell.textPrimary,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
  },
  dayChipActive: { backgroundColor: appShell.cta },
  dayChipText: { fontFamily: fonts.semiBold, fontSize: 13, color: appShell.textPrimary },
  dayChipTextActive: { color: palette.white },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    backgroundColor: appShell.canvasAlt,
  },
  timeText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14, color: appShell.textPrimary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '88%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  modalSuccess: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: appShell.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalActions: { alignSelf: 'stretch', width: '100%', gap: spacing.sm },
});
