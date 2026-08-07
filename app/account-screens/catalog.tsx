import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  PrimaryButton,
  SectionHeader,
  PremiumCard,
  UnderlineTabBar,
} from '@/components/ui';
import { CatalogPendingState } from '@/components/catalog/CatalogPendingState';
import { useCatalogStore } from '@/store/catalog-store';
import { catalogProductCount, isCatalogSetupComplete, type CatalogKind } from '@/lib/catalog-api';
import { appShell, spacing, radius, shadow } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { showPremiumToast } from '@/components/ui/PremiumToast';

const MODULES = [
  {
    key: 'products' as const,
    title: 'Product Catalog',
    hint: 'Sell physical items — food, clothes, and more.',
    icon: 'bag-handle-outline' as const,
  },
  {
    key: 'services' as const,
    title: 'Service Catalog',
    hint: 'Offer bookable services like makeup or consultations.',
    icon: 'calendar-outline' as const,
  },
];

/** Everything below the tab bar for one catalog kind — reused whichever tab is active. */
function CatalogKindPanel({ kind }: { kind: CatalogKind }) {
  const router = useRouter();
  const {
    catalogs,
    isLoading: isLoadingByKind,
    error: errorByKind,
    fetchMyCatalog,
    reopenCatalog,
    isSaving: isSavingByKind,
  } = useCatalogStore();
  const catalog = catalogs[kind];
  const isLoading = isLoadingByKind[kind];
  const error = errorByKind[kind];
  const isSaving = isSavingByKind[kind];
  const isServiceCatalog = kind === 'services';
  const catalogKindLabel = isServiceCatalog ? 'Service catalog' : 'Product catalog';
  const itemLabelPlural = isServiceCatalog ? 'services' : 'products';

  if (isLoading && !catalog) {
    return <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />;
  }

  if (error && !catalog) {
    return (
      <PremiumCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>Couldn't load your {catalogKindLabel.toLowerCase()}</Text>
        <Text style={styles.heroBody}>{error}</Text>
        <PrimaryButton
          label="Retry"
          onPress={() => void fetchMyCatalog(kind)}
          loading={isLoading}
        />
      </PremiumCard>
    );
  }

  if (catalog?.status === 'approved') {
    const shareUrl = catalog.liveStoreUrl?.trim() || null;
    const shareStorefront = async () => {
      if (!shareUrl) {
        showPremiumToast({
          title: 'Link not ready',
          message: 'Live link will appear once Ops finishes publishing.',
          durationMs: 2400,
        });
        return;
      }
      try {
        await Share.share({
          message: `Check out my storefront: ${shareUrl}`,
          url: shareUrl,
          title: catalog.storeName || 'My Storefront',
        });
      } catch {
        showPremiumToast({
          title: 'Share failed',
          message: 'Could not open the share sheet. Try again.',
          durationMs: 2200,
        });
      }
    };
    const openStorefront = async () => {
      if (!shareUrl) return;
      const can = await Linking.canOpenURL(shareUrl);
      if (!can) {
        showPremiumToast({
          title: 'Cannot open link',
          message: shareUrl,
          durationMs: 2600,
        });
        return;
      }
      await Linking.openURL(shareUrl);
    };
    return (
      <PremiumCard>
        <Text style={styles.heroTitle}>Your storefront is live</Text>
        <Text style={styles.heroBody}>
          {catalogProductCount(catalog)} {itemLabelPlural} · share your storefront link with
          followers.
        </Text>
        {shareUrl ? (
          <Text style={styles.heroBody}>{shareUrl}</Text>
        ) : (
          <Text style={styles.heroBody}>Live link will appear once Ops finishes publishing.</Text>
        )}
        <View style={styles.actions}>
          <PrimaryButton
            label="Share storefront"
            onPress={() => void shareStorefront()}
            disabled={!shareUrl}
          />
          {shareUrl ? (
            <PrimaryButton
              label="Open in browser"
              compact
              pill
              onPress={() => void openStorefront()}
            />
          ) : null}
        </View>
      </PremiumCard>
    );
  }

  if (catalog?.status === 'rejected') {
    const feedback = (catalog as { adminFeedback?: string }).adminFeedback;
    return (
      <PremiumCard>
        <Text style={styles.heroTitle}>{catalogKindLabel} not approved</Text>
        {feedback ? (
          <Text style={styles.heroBody}>{feedback}</Text>
        ) : (
          <Text style={styles.heroBody}>Please update your storefront and resubmit.</Text>
        )}
        <PrimaryButton
          label="Edit & resubmit"
          onPress={() => {
            void reopenCatalog(kind).then(() =>
              router.push({
                pathname: '/account-screens/catalog-builder',
                params: { kind },
              } as never)
            );
          }}
        />
      </PremiumCard>
    );
  }

  if (catalog?.status === 'pending_approval') {
    return (
      <CatalogPendingState
        categoryCount={catalog.categories.length}
        productCount={catalogProductCount(catalog)}
        itemLabelPlural={itemLabelPlural}
        refreshing={isLoading || isSaving}
        onRefresh={() => void fetchMyCatalog(kind)}
        onEditCatalog={() => {
          void reopenCatalog(kind).then(() => {
            router.push({
              pathname: '/account-screens/catalog-builder',
              params: { kind },
            } as never);
          });
        }}
      />
    );
  }

  const setupDone = isCatalogSetupComplete(catalog);
  const productCount = catalogProductCount(catalog);

  if (!setupDone) {
    const module = MODULES.find((m) => m.key === kind)!;
    return (
      <TouchableOpacity
        style={[styles.moduleCard, shadow.card, styles.singleModuleCard]}
        onPress={() =>
          router.push({
            pathname: '/account-screens/catalog-setup',
            params: { mode: kind },
          } as never)
        }
        accessibilityRole="button"
      >
        <View style={styles.moduleIconWell}>
          <Ionicons name={module.icon} size={26} color={appShell.cta} />
        </View>
        <Text style={styles.moduleTitle}>Set up your {catalogKindLabel.toLowerCase()}</Text>
        <Text style={styles.moduleHint}>{module.hint}</Text>
        <View style={styles.getStartedBtn}>
          <Text style={styles.getStartedBtnText}>Get started</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <PremiumCard style={styles.progressCard}>
      <Text style={styles.progressTitle}>Build progress</Text>
      <View style={styles.stepRow}>
        <Text style={styles.stepDone}>✓ {catalogKindLabel} set up</Text>
      </View>
      <View style={styles.stepRow}>
        <Text style={productCount > 0 ? styles.stepDone : styles.stepPending}>
          {productCount > 0 ? '✓' : '○'} {isServiceCatalog ? 'Services' : 'Products'} added (
          {productCount})
        </Text>
      </View>
      <View style={styles.stepRow}>
        <Text style={styles.stepPending}>○ Submitted for approval</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="Continue building"
          onPress={() =>
            router.push({ pathname: '/account-screens/catalog-builder', params: { kind } } as never)
          }
        />
        {productCount > 0 ? (
          <PrimaryButton
            label="Preview & submit"
            compact
            pill
            onPress={() =>
              router.push({
                pathname: '/account-screens/catalog-preview',
                params: { kind },
              } as never)
            }
          />
        ) : null}
      </View>
    </PremiumCard>
  );
}

export default function CatalogHomeScreen() {
  const router = useRouter();
  const { catalogs, isLoading, fetchMyCatalog } = useCatalogStore();
  const [activeTab, setActiveTab] = useState<CatalogKind>('products');

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog('products');
      void fetchMyCatalog('services');
    }, [fetchMyCatalog])
  );

  const anyLoading = isLoading.products || isLoading.services;
  if (anyLoading && !catalogs.products && !catalogs.services) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  const productsStarted = isCatalogSetupComplete(catalogs.products);
  const servicesStarted = isCatalogSetupComplete(catalogs.services);

  if (!productsStarted && !servicesStarted) {
    return (
      <ScrollScreen safeAreaEdges={['bottom']} dotBackground={false}>
        <SectionHeader title="My Storefront" subtitle="Choose what you want to set up" />
        <View style={styles.moduleRow}>
          {MODULES.map((m, idx) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.moduleCard, styles.premiumCardShadow]}
              onPress={() =>
                router.push({
                  pathname: '/account-screens/catalog-setup',
                  params: { mode: m.key },
                } as never)
              }
              accessibilityRole="button"
            >
              <View style={styles.moduleContentWrapper}>
                <View style={styles.moduleTopGroup}>
                  <View style={styles.moduleIconWell}>
                    <Ionicons name={m.icon} size={20} color={appShell.cta} />
                  </View>
                  <Text style={styles.moduleTitle}>{m.title}</Text>
                  <Text style={styles.moduleHint}>{m.hint}</Text>
                </View>

                <View
                  style={[
                    styles.arrowButtonContainer,
                    { backgroundColor: idx === 0 ? '#E8DFFF' : '#CFFAF2' },
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={idx === 0 ? '#7C6EFF' : '#10B981'}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.cornerDecoration,
                  { backgroundColor: idx === 0 ? '#EEE8FF' : '#DDFCF4' },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.heroDivider}>
          <Text style={styles.heroDividerText}>— CREATE. SELL. GROW. —</Text>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroTitleWrapper}>
            <Text style={styles.heroMainTitle}>Build your store,</Text>
            <Text style={[styles.heroMainTitle, styles.heroTitleAccent]}>your way</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Reach more people, showcase what you do, and turn your passion into income.
          </Text>
        </View>

        <View style={styles.phoneContainer}>
          <Image
            source={require('../../assets/phone_mock_png.jpeg')}
            style={styles.phoneMockup}
            contentFit="contain"
          />
        </View>

        <View style={styles.heroFooter}>
          <Text style={styles.heroFooterText}>✨ Your brand. Your story. Your store.</Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']} dotBackground={false}>
      <SectionHeader title="My Storefront" subtitle="Manage your product and service catalogs" />
      <UnderlineTabBar
        style={styles.tabBar}
        tabs={[
          { key: 'products', label: 'Products' },
          { key: 'services', label: 'Services' },
        ]}
        value={activeTab}
        onChange={(key) => setActiveTab(key as CatalogKind)}
      />
      <CatalogKindPanel kind={activeTab} />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: 'center', gap: spacing.sm },
  tabBar: { marginBottom: spacing.md },
  moduleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  heroDivider: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  heroDividerText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#7C6EFF',
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  heroTitleWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  heroMainTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 27,
    color: appShell.textPrimary,
    textAlign: 'center',
  },
  heroTitleAccent: {
    color: '#8B5CF6',
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '90%',
  },
  phoneContainer: {
    alignItems: 'center',
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
    width: '100%',
  },
  phoneMockup: {
    width: '82%',
    height: undefined,
    aspectRatio: 841 / 651,
  },
  heroFooter: {
    alignItems: 'center',
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  heroFooterText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  moduleCard: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing.sm,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  moduleContentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  moduleTopGroup: {
    gap: 4,
  },
  cornerDecoration: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 64,
    height: 64,
    borderTopLeftRadius: 64,
    opacity: 0.35,
  },
  singleModuleCard: { flex: undefined },
  getStartedBtn: {
    marginTop: spacing.sm,
    backgroundColor: appShell.cta,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  getStartedBtnText: { color: '#fff', fontFamily: fonts.semiBold },
  moduleIconWell: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F2FF',
  },
  moduleTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    color: appShell.textPrimary,
  },
  moduleHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: '#6B7280',
  },
  arrowButtonContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: appShell.textPrimary,
    textAlign: 'center',
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: appShell.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressCard: { gap: spacing.sm },
  progressTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: appShell.textPrimary,
    marginBottom: spacing.xs,
  },
  stepRow: { paddingVertical: 4 },
  stepDone: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.success },
  stepPending: { fontFamily: fonts.regular, fontSize: 14, color: appShell.textSecondary },
  actions: { marginTop: spacing.md, gap: spacing.sm },
});
