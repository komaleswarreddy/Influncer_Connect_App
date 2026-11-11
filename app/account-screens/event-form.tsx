import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabButton,
  KollabScreenHeader,
  KollabSegmented,
  KollabTextField,
  ScrollScreen,
  showKollabToast,
} from '@/components/ui';
import ScheduleDateTimeSheet, {
  dateToScheduleValue,
  type ScheduleDateTimeValue,
} from '@/components/scheduler/ScheduleDateTimeSheet';
import { eventsApi, type EventInput } from '@/lib/events-api';
import { combineDateTime, defaultEventWindow, formatEventRange } from '@/lib/events-ui';
import { font, useKollab } from '@/theme/kollab-tokens';

const WHERE = [
  { key: 'in_person', label: 'In person' },
  { key: 'online', label: 'Online' },
];

export default function EventFormScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const eventId = typeof id === 'string' ? id : undefined;

  const initial = defaultEventWindow();
  const [loading, setLoading] = useState(Boolean(eventId));
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [startsAt, setStartsAt] = useState<Date>(initial.start);
  const [endsAt, setEndsAt] = useState<Date>(initial.end);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('100');
  const [showRemaining, setShowRemaining] = useState(true);
  const [sheet, setSheet] = useState<'start' | 'end' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const { event } = await eventsApi.get(eventId);
      if (event.status === 'cancelled') {
        showKollabToast('A cancelled event can not be edited');
        router.back();
        return;
      }
      setTitle(event.title);
      setDescription(event.description ?? '');
      setBannerUrl(event.bannerUrl);
      setStartsAt(new Date(event.startsAt));
      setEndsAt(new Date(event.endsAt));
      setIsOnline(event.isOnline);
      setOnlineUrl(event.onlineUrl ?? '');
      setVenueName(event.venueName ?? '');
      setAddress(event.address ?? '');
      setCapacity(String(event.capacity));
      setShowRemaining(event.showRemaining);
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not load this event');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickBanner = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showKollabToast('Allow photo access to add a banner');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const res = await eventsApi.uploadBanner(
        asset.uri,
        asset.fileName ?? 'banner.jpg',
        asset.mimeType ?? 'image/jpeg'
      );
      setBannerUrl(res.url);
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not upload the banner');
    } finally {
      setUploading(false);
    }
  };

  const onSheetConfirm = (v: ScheduleDateTimeValue) => {
    const next = combineDateTime(v.date, v.hour24, v.minute);
    if (sheet === 'start') {
      // Moving the start keeps the event's length, so the end never ends up before it.
      const length = Math.max(endsAt.getTime() - startsAt.getTime(), 30 * 60 * 1000);
      setStartsAt(next);
      setEndsAt(new Date(next.getTime() + length));
    } else if (sheet === 'end') {
      setEndsAt(next);
    }
    setSheet(null);
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Give your event a name';
    if (endsAt.getTime() <= startsAt.getTime()) next.ends = 'The event must end after it starts';
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap < 1)
      next.capacity = 'Enter a whole number of attendees (1 or more)';
    if (isOnline) {
      if (!onlineUrl.trim()) next.onlineUrl = 'Add the join link (Zoom, Meet…)';
      else if (!/^https?:\/\//i.test(onlineUrl.trim()))
        next.onlineUrl = 'The join link must start with http:// or https://';
    } else {
      if (!venueName.trim()) next.venueName = 'Add the venue name';
      if (!address.trim()) next.address = 'Add the address (building, street, city)';
    }
    return next;
  };

  const save = async (): Promise<string | null> => {
    const found = validate();
    setErrors(found);
    const first = Object.values(found)[0];
    if (first) {
      showKollabToast(first);
      return null;
    }
    const body: EventInput = {
      title: title.trim(),
      description: description.trim(),
      bannerUrl,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      isOnline,
      onlineUrl: isOnline ? onlineUrl.trim() : '',
      venueName: isOnline ? '' : venueName.trim(),
      address: isOnline ? '' : address.trim(),
      capacity: Number(capacity),
      showRemaining,
    };
    setSaving(true);
    try {
      if (eventId) {
        await eventsApi.update(eventId, body);
        return eventId;
      }
      const res = await eventsApi.create(body);
      return res.event.id;
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not save the event');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    const savedId = await save();
    if (!savedId) return;
    showKollabToast(eventId ? 'Event updated' : 'Draft saved');
    if (eventId) router.back();
    else router.replace(`/account-screens/event-detail?id=${savedId}` as never);
  };

  const continueToPasses = async () => {
    const savedId = await save();
    if (!savedId) return;
    router.replace(`/account-screens/event-passes?id=${savedId}` as never);
  };

  const sheetValue: ScheduleDateTimeValue = dateToScheduleValue(
    sheet === 'end' ? endsAt : startsAt
  );

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <KollabScreenHeader
        title={eventId ? 'Edit event' : 'Create event'}
        right={
          <Pressable
            onPress={() => void saveDraft()}
            disabled={saving}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={[styles.headerAction, { color: c.violetDeep, opacity: saving ? 0.4 : 1 }]}>
              {eventId ? 'Save' : 'Save Draft'}
            </Text>
          </Pressable>
        }
      />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.stack}>
          {/* Banner */}
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: c.ink }]}>Event banner</Text>
              <Text style={[styles.hint, { color: c.ink }]}>16:9 · PNG, JPG or WEBP · max 5MB</Text>
            </View>
            <Pressable
              onPress={() => void pickBanner()}
              disabled={uploading}
              style={[styles.drop, { borderColor: c.violet, backgroundColor: c.well }]}
              accessibilityRole="button"
              accessibilityLabel="Upload event banner"
            >
              {bannerUrl ? (
                <Image
                  source={{ uri: bannerUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : uploading ? (
                <ActivityIndicator color={c.violet} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={34} color={c.violet} />
                  <Text style={[styles.dropText, { color: c.violetDeep }]}>
                    Upload event banner
                  </Text>
                </>
              )}
              {uploading && bannerUrl ? (
                <View style={styles.dim}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </Pressable>
            {bannerUrl ? (
              <Pressable
                onPress={() => setBannerUrl(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove banner"
              >
                <Text style={[styles.remove, { color: c.heat }]}>Remove banner</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Name + description */}
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: c.ink }]}>
                Event name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <Text style={[styles.hint, { color: c.ink }]}>{title.length} / 80</Text>
            </View>
            <KollabTextField
              surface="well"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Creator Growth Masterclass"
              maxLength={80}
            />
            {errors.title ? (
              <Text style={[styles.error, { color: c.heat }]}>{errors.title}</Text>
            ) : null}
            <Text style={[styles.cardTitle, { color: c.ink, marginTop: 6 }]}>Description</Text>
            <KollabTextField
              surface="well"
              value={description}
              onChangeText={setDescription}
              placeholder={
                'Tell attendees what to expect.\n\nStart a line with "- " for a bullet list.'
              }
              multiline
              maxLength={5000}
              style={{ minHeight: 130 }}
            />
          </View>

          {/* Schedule */}
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Text style={[styles.cardTitle, { color: c.ink }]}>Date & schedule</Text>
            <WhenRow label="Starts" date={startsAt} onPress={() => setSheet('start')} />
            <WhenRow label="Ends" date={endsAt} onPress={() => setSheet('end')} />
            <Text style={[styles.hint, { color: c.ink }]}>
              {formatEventRange(startsAt.toISOString(), endsAt.toISOString())}
            </Text>
            {errors.ends ? (
              <Text style={[styles.error, { color: c.heat }]}>{errors.ends}</Text>
            ) : null}
          </View>

          {/* Where */}
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Text style={[styles.cardTitle, { color: c.ink }]}>Venue & location</Text>
            <KollabSegmented
              segments={WHERE}
              value={isOnline ? 'online' : 'in_person'}
              onChange={(k) => setIsOnline(k === 'online')}
            />
            {isOnline ? (
              <>
                <Text style={[styles.fieldLabel, { color: c.ink }]}>
                  Join link <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <KollabTextField
                  surface="well"
                  value={onlineUrl}
                  onChangeText={setOnlineUrl}
                  placeholder="Join link (Zoom, Meet…)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={500}
                />
                {errors.onlineUrl ? (
                  <Text style={[styles.error, { color: c.heat }]}>{errors.onlineUrl}</Text>
                ) : null}
                <Text style={[styles.hint, { color: c.ink }]}>
                  The join link is only shown to people who have a ticket.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { color: c.ink }]}>
                  Venue name <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <KollabTextField
                  surface="well"
                  value={venueName}
                  onChangeText={setVenueName}
                  placeholder="Venue name, e.g. WeWork BKC"
                  maxLength={160}
                />
                {errors.venueName ? (
                  <Text style={[styles.error, { color: c.heat }]}>{errors.venueName}</Text>
                ) : null}
                <Text style={[styles.fieldLabel, { color: c.ink }]}>
                  Address <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <KollabTextField
                  surface="well"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Building, street, city"
                  maxLength={300}
                />
                {errors.address ? (
                  <Text style={[styles.error, { color: c.heat }]}>{errors.address}</Text>
                ) : null}
              </>
            )}
          </View>

          {/* Capacity */}
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Text style={[styles.cardTitle, { color: c.ink }]}>
              Event capacity <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <KollabTextField
              surface="well"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              placeholder="Maximum attendees"
              maxLength={6}
            />
            {errors.capacity ? (
              <Text style={[styles.error, { color: c.heat }]}>{errors.capacity}</Text>
            ) : null}
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: c.ink }]}>
                  Show remaining tickets publicly
                </Text>
                <Text style={[styles.hint, { color: c.ink }]}>
                  Shows an “Only N passes left” pill when seats run low.
                </Text>
              </View>
              <Switch
                value={showRemaining}
                onValueChange={setShowRemaining}
                trackColor={{ false: c.outline, true: c.violet }}
                thumbColor={c.card}
                accessibilityLabel="Show remaining tickets publicly"
              />
            </View>
          </View>

          <KollabButton
            label="Continue to Pass Setup"
            variant="primary"
            loading={saving}
            onPress={() => void continueToPasses()}
          />
        </View>
      )}

      <ScheduleDateTimeSheet
        visible={sheet !== null}
        value={sheetValue}
        onClose={() => setSheet(null)}
        onConfirm={onSheetConfirm}
      />
    </ScrollScreen>
  );
}

function WhenRow({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) {
  const kollab = useKollab();
  const c = kollab.color;
  const h = date.getHours();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(date.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.whenRow, { backgroundColor: c.well, borderColor: c.outline }]}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${date.getDate()} ${months[date.getMonth()]} ${time}`}
    >
      <Text style={[styles.whenLabel, { color: c.ink }]}>{label}</Text>
      <Text style={[styles.whenValue, { color: c.ink }]}>
        {date.getDate()} {months[date.getMonth()]} {date.getFullYear()} · {time}
      </Text>
      <Ionicons name="calendar-outline" size={20} color={c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  headerAction: { fontFamily: font.bold, fontSize: 15 },
  card: { borderRadius: 22, padding: 16, gap: 10 },
  cardTitle: { fontFamily: font.bold, fontSize: 15 },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hint: { fontFamily: font.body, fontSize: 12, opacity: 0.55 },
  error: { fontFamily: font.medium, fontSize: 12.5 },
  fieldLabel: { fontFamily: font.semiBold, fontSize: 13.5, marginTop: 4 },
  drop: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 18,
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  dropText: { fontFamily: font.bold, fontSize: 15 },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: { fontFamily: font.semiBold, fontSize: 12.5, alignSelf: 'flex-end' },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  whenLabel: { fontFamily: font.bold, fontSize: 12.5, width: 46, opacity: 0.6 },
  whenValue: { flex: 1, fontFamily: font.medium, fontSize: 14 },
});
