import { openExternalUrl } from '../../lib/safe-link';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatTile,
  KollabStatusChip,
  ScrollScreen,
  showKollabToast,
} from '@/components/ui';
import { GoogleConnectCard } from '@/components/meet/GoogleConnectCard';
import { meetsApi, type MeetOverview, type MeetServiceListItem } from '@/lib/meets-api';
import { discountLabel, summarizeWindows } from '@/lib/meets-ui';
import { formatInr } from '@/lib/currency';
import { meetShareText } from '@/lib/share-text';
import { font, useKollab } from '@/theme/kollab-tokens';

const BENEFITS: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  sub: string;
}[] = [
  {
    icon: 'calendar-outline',
    title: 'Accept bookings',
    sub: 'Brands and clients can schedule instantly.',
  },
  {
    icon: 'time-outline',
    title: 'Manage availability',
    sub: 'Control your weekly schedule effortlessly.',
  },
  { icon: 'wallet-outline', title: 'Get paid', sub: 'Receive secure payments with every session.' },
];

export default function MeetsScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const [data, setData] = useState<MeetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await meetsApi.overview());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your meets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const create = () => router.push('/account-screens/meet-form' as never);
  const edit = (s: MeetServiceListItem) =>
    router.push(`/account-screens/meet-form?id=${s.id}` as never);

  const copy = async (s: MeetServiceListItem) => {
    try {
      await Clipboard.setStringAsync(s.url);
      showKollabToast('Link copied');
    } catch {
      showKollabToast('Could not copy the link');
    }
  };
  const share = async (s: MeetServiceListItem) => {
    try {
      await Share.share({
        message: meetShareText({
          title: s.title,
          durationMinutes: s.durationMinutes,
          priceLabel: s.isFree ? 'Free' : formatInr(s.price),
          url: s.url,
        }),
      });
    } catch {
      showKollabToast('Could not open the share sheet');
    }
  };
  const open = async (s: MeetServiceListItem) => {
    try {
      await openExternalUrl(s.url);
    } catch {
      showKollabToast('Could not open the link');
    }
  };

  const services = data?.services ?? [];

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Meet scheduler" subtitle="Paid or free 1:1 sessions" />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : error && !data ? (
        <KollabEmptyCard
          title="Couldn’t load your meets"
          subtitle={error}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load();
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : services.length === 0 && data ? (
        <View style={styles.intro}>
          <View style={[styles.hero, { backgroundColor: c.well }]}>
            <Ionicons name="videocam" size={56} color={c.violetDeep} />
          </View>
          <Text style={[styles.introTitle, { color: c.ink }]}>
            Create sessions, connect and grow
          </Text>
          <Text style={[styles.introSub, { color: c.ink }]}>
            Schedule meets and connect with your audience in just a few taps.
          </Text>
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: c.well }]}>
                  <Ionicons name={b.icon} size={22} color={c.violetDeep} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.benefitTitle, { color: c.ink }]}>{b.title}</Text>
                  <Text style={[styles.benefitSub, { color: c.ink }]}>{b.sub}</Text>
                </View>
              </View>
            ))}
          </View>
          <GoogleConnectCard
            status={data.google}
            onChange={(google) => setData({ ...data, google })}
          />
          <KollabButton label="Get started" variant="primary" onPress={create} />
        </View>
      ) : data ? (
        <View style={styles.list}>
          <View style={styles.tiles}>
            <KollabStatTile
              label="Upcoming"
              value={String(data.earnings.upcoming)}
              style={styles.flex}
            />
            <KollabStatTile
              label="Sessions"
              value={String(data.earnings.sessions)}
              style={styles.flex}
            />
            <KollabStatTile
              label="Earned"
              value={formatInr(data.earnings.net)}
              style={styles.flex}
            />
          </View>

          <GoogleConnectCard
            status={data.google}
            onChange={(google) => setData({ ...data, google })}
          />

          <View style={styles.actions}>
            <KollabButton
              label="New meet"
              variant="ink"
              compact
              onPress={create}
              style={styles.flex}
            />
            <KollabButton
              label="Bookings"
              variant="soft"
              compact
              onPress={() => router.push('/account-screens/meet-bookings' as never)}
              style={styles.flex}
            />
          </View>

          {services.map((s) => {
            const off = discountLabel(s.mrp, s.price);
            const live = s.status === 'published';
            return (
              <View
                key={s.id}
                style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}
              >
                <Pressable
                  onPress={() => edit(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${s.title}`}
                  style={styles.cardBody}
                >
                  <View style={styles.cardTop}>
                    <Text style={[styles.title, { color: c.ink }]} numberOfLines={2}>
                      {s.title}
                    </Text>
                    <KollabStatusChip
                      tone={live ? 'live' : 'neutral'}
                      label={live ? 'Live' : 'Draft'}
                    />
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: c.ink }]}>
                      {s.isFree ? 'Free' : formatInr(s.price)}
                    </Text>
                    {s.mrp > s.price ? (
                      <Text style={[styles.mrp, { color: c.ink }]}>{formatInr(s.mrp)}</Text>
                    ) : null}
                    {off ? <Text style={[styles.off, { color: c.teal }]}>{off}</Text> : null}
                    <Text style={[styles.meta, { color: c.ink }]}>· {s.durationMinutes} min</Text>
                  </View>
                  <Text style={[styles.meta, { color: c.ink }]}>{summarizeWindows(s.windows)}</Text>
                  <Text style={[styles.stat, { color: c.violetDeep }]}>
                    {s.upcomingBookings} upcoming · {s.totalBookings} total
                  </Text>
                </Pressable>
                {live ? (
                  <View style={styles.actions}>
                    <KollabButton
                      label="Copy"
                      variant="soft"
                      compact
                      onPress={() => void copy(s)}
                      style={styles.flex}
                    />
                    <KollabButton
                      label="Share"
                      variant="soft"
                      compact
                      onPress={() => void share(s)}
                      style={styles.flex}
                    />
                    <KollabButton
                      label="View"
                      variant="hairline"
                      compact
                      onPress={() => void open(s)}
                      style={styles.flex}
                    />
                  </View>
                ) : (
                  <KollabButton
                    label="Finish & publish"
                    variant="primary"
                    compact
                    onPress={() => edit(s)}
                  />
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { gap: 16, paddingTop: 4 },
  hero: {
    alignSelf: 'center',
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  introTitle: { fontFamily: font.display, fontSize: 30, textAlign: 'center', lineHeight: 34 },
  introSub: { fontFamily: font.body, fontSize: 15, opacity: 0.6, textAlign: 'center' },
  benefits: { gap: 14, marginVertical: 4 },
  benefit: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { fontFamily: font.bold, fontSize: 16 },
  benefitSub: { fontFamily: font.body, fontSize: 13.5, opacity: 0.6 },
  list: { gap: 12 },
  tiles: { flexDirection: 'row', gap: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  card: { borderRadius: 22, padding: 15, gap: 12 },
  cardBody: { gap: 5 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: { flex: 1, fontFamily: font.bold, fontSize: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  price: { fontFamily: font.bold, fontSize: 18 },
  mrp: { fontFamily: font.body, fontSize: 13, opacity: 0.45, textDecorationLine: 'line-through' },
  off: { fontFamily: font.bold, fontSize: 12.5 },
  meta: { fontFamily: font.body, fontSize: 13, opacity: 0.6 },
  stat: { fontFamily: font.bold, fontSize: 13.5, marginTop: 2 },
});
