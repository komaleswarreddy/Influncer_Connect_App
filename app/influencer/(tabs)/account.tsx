import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/auth-store';
import { cognitoConfigured } from '../../../lib/auth-config';
import { logoutFromCognito } from '../../../lib/cognito-auth';
import {
  ScrollScreen,
  Glyph,
  KollabScreenHeader,
  KollabSectionLabel,
  type GlyphName,
} from '@/components/ui';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

type AccountLink = {
  key: string;
  label: string;
  glyph: GlyphName;
  path: string;
  badge?: string;
};

const GROUPS: { label: string; rows: AccountLink[] }[] = [
  {
    label: 'creator tools',
    rows: [
      { key: 'price-card', label: 'Price Card', glyph: 'tag', path: '/account-screens/rate-card' },
      {
        key: 'rate-calculator',
        label: 'Rate Calculator',
        glyph: 'calc',
        path: '/account-screens/rate-calculator',
      },
      {
        key: 'my-storefront',
        label: 'My Storefront',
        glyph: 'store',
        path: '/account-screens/catalog',
      },
    ],
  },
  {
    label: 'monetization',
    rows: [
      {
        key: 'bookings',
        label: 'PriceCard Bookings',
        glyph: 'cal',
        path: '/account-screens/bookings',
      },
      { key: 'ratings', label: 'Collab ratings', glyph: 'check', path: '/influencer/rating-cards' },
    ],
  },
  {
    label: 'account',
    rows: [
      {
        key: 'instagram',
        label: 'Instagram',
        glyph: 'ig',
        path: '/account-screens/instagram-hub',
        badge: 'NEW',
      },
      { key: 'payments', label: 'Payments', glyph: 'wallet', path: '/account-screens/payments' },
      { key: 'support-hub', label: 'Support', glyph: 'help', path: '/account-screens/support-hub' },
      {
        key: 'settings',
        label: 'Profile settings',
        glyph: 'gear',
        path: '/account-screens/settings',
      },
    ],
  },
];

export default function AccountScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const handle = (user?.username || user?.firstName || 'you').replace(/^@+/, '');
  const letter = handle.slice(0, 1).toUpperCase();

  const onLogout = async () => {
    if (cognitoConfigured) {
      try {
        // logoutFromCognito() is internally bounded (LOGOUT_TIMEOUT_MS) and
        // never throws — this await is guaranteed to resolve within that
        // window, so a hung Cognito browser session can't block logout.
        await logoutFromCognito();
      } catch {
        /* still clear local session */
      }
    }
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollScreen padH={0} safeAreaEdges={['top', 'left', 'right']} contentInsetBottom>
      <View style={styles.headPad}>
        <KollabScreenHeader
          title="Account"
          subtitle="Tools and profile"
          showBack={false}
          size="tab"
        />
      </View>

      <View style={[styles.identity, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        <View style={[styles.mark, { backgroundColor: kollab.color.panel }]}>
          <Text style={[styles.markText, { color: kollab.color.chartreuse }]}>{letter}</Text>
        </View>
        <View style={styles.identityCopy}>
          <Text style={[styles.uname, { color: kollab.color.ink }]} numberOfLines={1}>
            {handle}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/account-screens/settings' as never)}
          style={[styles.rating, { backgroundColor: kollab.color.chartreuse }]}
          accessibilityRole="button"
          accessibilityLabel="Profile settings"
        >
          <Text style={[styles.ratingText, { color: kollab.color.onChartreuse }]}>★</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/influencer/dashboard' as never)}
        style={[styles.freshCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        accessibilityRole="button"
        accessibilityLabel="Browse fresh collabs"
      >
        <View style={styles.freshCopy}>
          <Text style={[styles.freshTitle, { color: kollab.color.ink }]}>Fresh collabs</Text>
          <Text style={[styles.freshMeta, { color: kollab.color.ink }]}>
            Open campaigns you can apply to
          </Text>
        </View>
        <Text style={[styles.freshOpen, { color: kollab.color.violetDeep }]}>open →</Text>
      </Pressable>

      {GROUPS.map((g) => (
        <View key={g.label}>
          <KollabSectionLabel label={g.label} style={styles.groupLabel} />
          <View style={[styles.card, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
            {g.rows.map((row, i) => (
              <Pressable
                key={row.key}
                onPress={() => router.push(row.path as never)}
                style={[
                  styles.row,
                  i < g.rows.length - 1
                    ? {
                        borderBottomColor: kollab.color.hairline,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      }
                    : null,
                ]}
              >
                <View style={[styles.well, { backgroundColor: kollab.color.well }]}>
                  <Glyph name={row.glyph} color={kollab.color.ink} size={18} />
                </View>
                <Text style={[styles.rowLabel, { color: kollab.color.ink }]}>{row.label}</Text>
                {row.badge ? (
                  <View style={[styles.badge, { backgroundColor: kollab.color.chartreuse }]}>
                    <Text style={[styles.badgeText, { color: kollab.color.onChartreuse }]}>
                      {row.badge}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.caret, { color: kollab.color.ink }]}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => void onLogout()}
        style={[styles.logout, { borderColor: kollab.color.ink }]}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Text style={[styles.logoutText, { color: kollab.color.ink }]}>Log out</Text>
      </Pressable>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  headPad: {
    paddingHorizontal: 22,
    paddingTop: 2,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginHorizontal: 18,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontFamily: font.display,
    fontSize: 23,
  },
  identityCopy: { flex: 1, minWidth: 0 },
  uname: {
    ...kType.sectionTitle,
  },
  rating: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ratingText: {
    fontFamily: font.bold,
    fontSize: 11,
  },
  freshCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 12,
  },
  freshCopy: { flex: 1, minWidth: 0 },
  freshTitle: {
    ...kType.rowTitle,
  },
  freshMeta: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    marginTop: 2,
  },
  freshOpen: {
    fontFamily: font.bold,
    fontSize: 12.5,
  },
  groupLabel: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 10,
    marginBottom: 0,
  },
  card: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
  },
  well: {
    width: 36,
    height: 36,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: font.semiBold,
    fontSize: 14,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeText: {
    fontFamily: font.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  caret: {
    fontSize: 15,
    opacity: 0.35,
  },
  logout: {
    marginHorizontal: 18,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: font.semiBold,
    fontSize: 14.5,
  },
});
