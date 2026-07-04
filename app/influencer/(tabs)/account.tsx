import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/auth-store';
import { kindeConfigured } from '../../../lib/auth-config';
import { AccountKindeLogout } from '../../../components/AccountKindeLogout';
import { ScrollScreen, PremiumCard, ListRow, SectionHeader } from '@/components/ui';
import { appShell, palette, premiumNavy, spacing, radius, shadow } from '@/theme';
import { fonts } from '@/components/ui/typography';

type AccountLink = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  path: string;
  badge?: string;
};

const MONETIZATION_LINKS: AccountLink[] = [
  { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' as const, path: '/account-screens/bookings' },
  { key: 'ugc-earnings', label: 'UGC earnings', icon: 'cash-outline' as const, path: '/account-screens/ugc-earnings' },
];

const ACCOUNT_LINKS: AccountLink[] = [
  { key: 'rate-calculator', label: 'Rate Calculator', icon: 'calculator-outline' as const, path: '/account-screens/rate-calculator' },
  { key: 'rate-card', label: 'Rate Card', icon: 'pricetag-outline' as const, path: '/account-screens/rate-card' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' as const, path: '/account-screens/instagram-hub', badge: 'NEW' },
  { key: 'trending-ideas', label: 'Trending ideas', icon: 'bulb-outline' as const, path: '/account-screens/trending-ideas' },
  { key: 'catalog', label: 'Catalog', icon: 'storefront-outline' as const, path: '/account-screens/catalog' },
  { key: 'payments', label: 'Payments', icon: 'wallet-outline' as const, path: '/account-screens/payments' },
  { key: 'support-hub', label: 'Support', icon: 'help-circle-outline' as const, path: '/account-screens/support-hub' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' as const, path: '/account-screens/settings' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { logout, user, nextStep } = useAuthStore();
  const profileIncomplete =
    user?.profileCompleted === false ||
    nextStep === 'COMPLETE_INFLUENCER_PROFILE' ||
    nextStep === 'PENDING_PLATFORM_APPROVAL';

  const handleItemPress = (link: AccountLink) => {
    if (link.path) {
      router.push(link.path as never);
    }
  };

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right']} contentInsetBottom>
      <SectionHeader title="Account" subtitle="Tools and profile" />
      {profileIncomplete ? (
        <TouchableOpacity
          style={styles.profileBannerOuter}
          onPress={() => router.push('/account-screens/settings')}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={[...premiumNavy.base.colors]}
            locations={[...premiumNavy.base.locations]}
            start={premiumNavy.base.start}
            end={premiumNavy.base.end}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[...premiumNavy.sheen.colors]}
            locations={[...premiumNavy.sheen.locations]}
            start={premiumNavy.sheen.start}
            end={premiumNavy.sheen.end}
            style={styles.profileBannerSheen}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[...premiumNavy.bottomTint.colors]}
            start={premiumNavy.bottomTint.start}
            end={premiumNavy.bottomTint.end}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.profileBannerInner}>
            <View style={styles.profileBannerIconRing}>
              <Ionicons name="sparkles" size={20} color="rgba(248,250,252,0.95)" />
            </View>
            <View style={styles.profileBannerCopy}>
              <Text style={styles.profileBannerOverline}>Recommended</Text>
              <Text style={styles.profileBannerTitle}>Complete your profile</Text>
              <Text style={styles.profileBannerHint}>
                Add your details in Settings â€” unlock campaigns tailored to you.
              </Text>
            </View>
            <View style={styles.profileBannerChevron}>
              <Ionicons name="chevron-forward" size={22} color="rgba(248,250,252,0.88)" />
            </View>
          </View>
        </TouchableOpacity>
      ) : null}

      <SectionHeader title="Monetization" subtitle="Bookings and UGC payouts" />
      <PremiumCard style={{ marginBottom: spacing.sm }}>
        {MONETIZATION_LINKS.map((link, i) => (
          <View key={link.key} style={i > 0 ? styles.rowBorder : undefined}>
            <ListRow
              compact
              title={link.label}
              iconName={link.icon}
              iconColor={appShell.cta}
              iconWellColor={appShell.iceBlue}
              showChevron
              onPress={() => handleItemPress(link)}
            />
          </View>
        ))}
      </PremiumCard>

      <SectionHeader title="Tools" subtitle="Instagram, catalog, and more" />
      <PremiumCard style={{ marginBottom: spacing.sm }}>
        {ACCOUNT_LINKS.map((link, i) => (
          <View key={link.key} style={i > 0 ? styles.rowBorder : undefined}>
            <ListRow
              compact
              title={link.label}
              iconName={link.icon}
              iconColor={appShell.cta}
              iconWellColor={appShell.iceBlue}
              showChevron={!link.badge}
              trailing={
                link.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{link.badge}</Text>
                  </View>
                ) : undefined
              }
              onPress={() => handleItemPress(link)}
            />
          </View>
        ))}
      </PremiumCard>

      {kindeConfigured ? (
        <AccountKindeLogout />
      ) : (
        <TouchableOpacity
          style={styles.logout}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          <Ionicons name="log-out-outline" size={22} color={palette.error} style={{ marginRight: spacing.sm }} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  profileBannerOuter: {
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shadow.card,
  },
  profileBannerSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  profileBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  profileBannerIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  profileBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileBannerOverline: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(226, 232, 240, 0.72)',
    marginBottom: 4,
  },
  profileBannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: '#F8FAFC',
  },
  profileBannerHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(226, 232, 240, 0.88)',
    marginTop: 4,
  },
  profileBannerChevron: {
    justifyContent: 'center',
    paddingLeft: 2,
  },
  badge: {
    backgroundColor: appShell.cta,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: palette.white,
    letterSpacing: 0.5,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  logoutText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: palette.error,
  },
});
