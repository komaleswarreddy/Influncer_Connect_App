import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen, PrimaryButton, SectionHeader, PremiumCard } from '@/components/ui';
import { CatalogPendingState } from '@/components/catalog/CatalogPendingState';
import { useCatalogStore } from '@/store/catalog-store';
import { catalogProductCount, isCatalogSetupComplete } from '@/lib/catalog-api';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

export default function CatalogHomeScreen() {
  const router = useRouter();
  const { catalog, isLoading, error, fetchMyCatalog, reopenCatalog, isSaving } = useCatalogStore();

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog();
    }, [fetchMyCatalog])
  );

  if (isLoading && !catalog) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  if (error && !catalog) {
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="Catalog" subtitle="Something went wrong" />
        <PremiumCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Couldn't load your catalog</Text>
          <Text style={styles.heroBody}>{error}</Text>
          <PrimaryButton label="Retry" onPress={() => void fetchMyCatalog()} loading={isLoading} />
        </PremiumCard>
      </ScrollScreen>
    );
  }

  if (catalog?.status === 'approved') {
    const slug = catalog.slug;
    const shareUrl = slug
      ? `${process.env.EXPO_PUBLIC_API_URL || ''}/catalog/${slug}`.replace(/\/\/$/, '')
      : null;
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="Catalog" subtitle={catalog.storeName ?? 'Approved'} />
        <PremiumCard>
          <Text style={styles.heroTitle}>Your catalog is live</Text>
          <Text style={styles.heroBody}>
            {catalogProductCount(catalog)} products · share your store link with followers.
          </Text>
          {shareUrl ? <Text style={styles.heroBody}>{shareUrl}</Text> : null}
          <PrimaryButton
            label="Edit catalog"
            onPress={() => router.push('/account-screens/catalog-builder' as never)}
          />
          <PrimaryButton
            label="View affiliate links"
            compact
            pill
            onPress={() => router.push('/account-screens/affiliate-links' as never)}
          />
        </PremiumCard>
      </ScrollScreen>
    );
  }

  if (catalog?.status === 'rejected') {
    const feedback = (catalog as { adminFeedback?: string }).adminFeedback;
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="Catalog" subtitle="Needs changes" />
        <PremiumCard>
          <Text style={styles.heroTitle}>Catalog not approved</Text>
          {feedback ? (
            <Text style={styles.heroBody}>{feedback}</Text>
          ) : (
            <Text style={styles.heroBody}>Please update your catalog and resubmit.</Text>
          )}
          <PrimaryButton
            label="Edit & resubmit"
            onPress={() => {
              void reopenCatalog().then(() =>
                router.push('/account-screens/catalog-builder' as never)
              );
            }}
          />
        </PremiumCard>
      </ScrollScreen>
    );
  }

  if (catalog?.status === 'pending_approval') {
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="Catalog" subtitle="Your product catalog" />
        <CatalogPendingState
          categoryCount={catalog.categories.length}
          productCount={catalogProductCount(catalog)}
          refreshing={isLoading || isSaving}
          onRefresh={() => void fetchMyCatalog()}
          onEditCatalog={() => {
            void reopenCatalog().then(() => {
              router.push('/account-screens/catalog-builder' as never);
            });
          }}
        />
      </ScrollScreen>
    );
  }

  const setupDone = isCatalogSetupComplete(catalog);
  const productCount = catalogProductCount(catalog);

  if (!setupDone) {
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="Catalog" subtitle="Share your products with your audience" />
        <PremiumCard style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🛍️</Text>
          <Text style={styles.heroTitle}>Create your catalog</Text>
          <Text style={styles.heroBody}>
            Set up your business, add categories and products with photos, then submit for review.
          </Text>
          <PrimaryButton
            label="Create catalog"
            onPress={() => router.push('/account-screens/catalog-setup' as never)}
          />
        </PremiumCard>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Catalog" subtitle={catalog?.storeName ?? 'Your catalog'} />
      <PremiumCard style={styles.progressCard}>
        <Text style={styles.progressTitle}>Build progress</Text>
        <View style={styles.stepRow}>
          <Text style={styles.stepDone}>✓ Catalog set up</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={productCount > 0 ? styles.stepDone : styles.stepPending}>
            {productCount > 0 ? '✓' : '○'} Products added ({productCount})
          </Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepPending}>○ Submitted for approval</Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            label="Continue building"
            onPress={() => router.push('/account-screens/catalog-builder' as never)}
          />
          {productCount > 0 ? (
            <PrimaryButton
              label="Preview & submit"
              compact
              pill
              onPress={() => router.push('/account-screens/catalog-preview' as never)}
            />
          ) : null}
        </View>
      </PremiumCard>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: 'center', gap: spacing.sm },
  heroEmoji: { fontSize: 48, marginBottom: spacing.xs },
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
