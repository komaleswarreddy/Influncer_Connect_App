import React, { useCallback, useMemo, useState } from 'react';
import { storefrontShareText } from '@/lib/share-text';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Share, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen, KollabScreenHeader, KollabButton, showKollabToast } from '@/components/ui';
import { useCatalogStore } from '@/store/catalog-store';
import {
  catalogCoverUrl,
  catalogImageSource,
  catalogProductCount,
  flattenCatalogProducts,
  isCatalogSetupComplete,
  productImageUrl,
  type CatalogKind,
  type CatalogProduct,
  type CatalogStatus,
} from '@/lib/catalog-api';
import { formatInr } from '@/lib/currency';
import { useKollab, font, space, choiceChipColors, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

const TABS: { key: CatalogKind; label: string }[] = [
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
];

function productCover(product: CatalogProduct, catalogCover?: string | null) {
  return catalogImageSource(productImageUrl(product) ?? catalogCover);
}

function visitLabel(visit?: CatalogProduct['visitType']): string | null {
  if (!visit) return null;
  if (visit === 'salon') return 'At salon';
  if (visit === 'center') return 'Center';
  if (visit === 'online') return 'Online';
  if (visit === 'virtual') return 'Virtual';
  return 'Home';
}

function productMeta(product: CatalogProduct, isService: boolean, categoryName?: string): string {
  const bits: string[] = [];
  if (categoryName) bits.push(categoryName);
  if (isService && product.durationMinutes) bits.push(`${product.durationMinutes} min`);
  const visit = visitLabel(product.visitType);
  if (visit) bits.push(visit);
  if (!bits.length && product.description) return product.description;
  return bits.join(' · ') || (isService ? 'Service' : 'Product');
}

function statusSpec(
  status: CatalogStatus | undefined,
  kollab: KollabTokens
): { short: string; bg: string; fg: string } {
  if (status === 'approved') return { short: 'Live', ...kollab.statusChip.live };
  if (status === 'pending_approval') return { short: 'Review', ...kollab.statusChip.info };
  if (status === 'rejected') return { short: 'Rejected', ...kollab.statusChip.warn };
  return { short: 'Draft', ...kollab.statusChip.neutral };
}

export default function CatalogHomeScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const styles = useStyles(kollab);
  const { catalogs, isLoading, error, fetchMyCatalog, reopenCatalog, isSaving } = useCatalogStore();
  const [activeTab, setActiveTab] = useState<CatalogKind>('products');

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog('products');
      void fetchMyCatalog('services');
    }, [fetchMyCatalog])
  );

  const kind = activeTab;
  const catalog = catalogs[kind];
  const loading = isLoading[kind];
  const err = error[kind];
  const saving = isSaving[kind];
  const isService = kind === 'services';
  const itemWord = isService ? 'service' : 'product';
  const itemWordPlural = isService ? 'services' : 'products';
  const count = catalogProductCount(catalog);
  const setupDone = isCatalogSetupComplete(catalog);
  const storeCover = catalogCoverUrl(catalog);
  const products = flattenCatalogProducts(catalog);
  const categoryById = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of catalog?.categories ?? []) {
      for (const p of cat.products ?? []) map.set(p.id, cat.name);
    }
    return map;
  }, [catalog]);
  const st = statusSpec(catalog?.status, kollab);

  const goSetup = () =>
    router.push({ pathname: '/account-screens/catalog-setup', params: { mode: kind } } as never);
  const goBuilder = () =>
    router.push({ pathname: '/account-screens/catalog-builder', params: { kind } } as never);
  const goPreview = () =>
    router.push({ pathname: '/account-screens/catalog-preview', params: { kind } } as never);

  const onCta = () => {
    if (catalog?.status === 'rejected') {
      void reopenCatalog(kind).then(() => goBuilder());
      return;
    }
    if (catalog?.status === 'approved' || (setupDone && count > 0)) {
      goPreview();
      return;
    }
    if (setupDone) {
      goBuilder();
      return;
    }
    goSetup();
  };

  const ctaLabel =
    catalog?.status === 'rejected'
      ? 'Edit & resubmit'
      : catalog?.status === 'approved' || (setupDone && count > 0)
        ? 'Preview storefront'
        : setupDone
          ? 'Continue building'
          : 'Continue setup';

  const shareUrl = catalog?.liveStoreUrl?.trim() || null;
  const shareStorefront = async () => {
    if (!shareUrl) {
      showKollabToast('Live link will appear once Ops finishes publishing.');
      return;
    }
    try {
      await Share.share({
        message: storefrontShareText({ storeName: catalog?.storeName ?? null, url: shareUrl }),
        title: catalog?.storeName || 'My storefront',
      });
      showKollabToast('Storefront link copied');
    } catch {
      showKollabToast('Could not open the share sheet. Try again.');
    }
  };

  const anyLoading = isLoading.products || isLoading.services;
  if (anyLoading && !catalogs.products && !catalogs.services) {
    return (
      <ScrollScreen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headPad}>
          <KollabScreenHeader
            title="My storefront"
            subtitle="Products and services you sell to followers"
          />
        </View>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 40 }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headPad}>
        <KollabScreenHeader
          title="My storefront"
          subtitle="Products and services you sell to followers"
        />
      </View>

      <View style={styles.chips}>
        {TABS.map((t) => {
          const on = t.key === activeTab;
          const chip = choiceChipColors(kollab, on);
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: chip.backgroundColor,
                  borderColor: chip.borderColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, { color: chip.color }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {err && !catalog ? (
        <View style={[styles.card, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
          <Text style={[styles.errorTitle, { color: kollab.color.ink }]}>
            Couldn't load your {itemWordPlural}
          </Text>
          <Text style={[styles.hint, { color: kollab.color.ink }]}>{err}</Text>
          <KollabButton
            label={loading ? 'Retrying…' : 'Retry'}
            disabled={loading}
            onPress={() => void fetchMyCatalog(kind)}
          />
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadCopy}>
              <Text style={[styles.count, { color: kollab.color.ink }]}>
                {count} {count === 1 ? itemWord : itemWordPlural}
              </Text>
              <Text style={[styles.hint, { color: kollab.color.ink }]}>
                {isService
                  ? 'Offer bookable services like makeup or consultations.'
                  : 'Sell physical items — food, clothes, and more.'}
              </Text>
            </View>
            <View style={[styles.status, { backgroundColor: st.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: st.fg }]} />
              <Text style={[styles.statusText, { color: st.fg }]}>{st.short}</Text>
            </View>
          </View>

          {catalog?.status === 'rejected' && catalog.adminFeedback ? (
            <Text style={[styles.feedback, { color: kollab.color.heat }]}>
              {catalog.adminFeedback}
            </Text>
          ) : null}

          {catalog?.status === 'pending_approval' ? (
            <Text style={[styles.feedback, { color: kollab.color.ink }]}>
              Ops is reviewing this catalog. You can keep editing after reopening.
            </Text>
          ) : null}

          {loading && !catalog ? (
            <ActivityIndicator color={kollab.color.ink} style={{ marginVertical: 18 }} />
          ) : products.length > 0 ? (
            <View style={styles.rows}>
              {products.map((p) => (
                <CatalogPhotoRow
                  key={p.id}
                  product={p}
                  meta={productMeta(p, isService, categoryById.get(p.id))}
                  catalogCover={storeCover}
                  onPress={goBuilder}
                />
              ))}
            </View>
          ) : (
            <Pressable
              onPress={setupDone ? goBuilder : goSetup}
              style={styles.emptyRow}
              accessibilityRole="button"
            >
              <View style={[styles.emptyThumb, { backgroundColor: kollab.color.imgBg }]} />
              <View style={styles.emptyCopy}>
                <Text style={[styles.emptyTitle, { color: kollab.color.ink }]}>
                  {setupDone ? `No ${itemWordPlural} yet` : 'Set up your storefront'}
                </Text>
                <Text style={[styles.hint, { color: kollab.color.ink }]}>
                  {setupDone
                    ? `Add ${itemWordPlural} followers can buy.`
                    : 'Products and services you sell to followers.'}
                </Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={onCta}
            disabled={saving}
            style={[styles.cta, { backgroundColor: kollab.color.panel }]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text style={[styles.ctaText, { color: kollab.color.panelInk }]}>{ctaLabel}</Text>
            <Text style={[styles.ctaCaret, { color: kollab.color.panelInk }]}>›</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={setupDone ? goBuilder : goSetup}
          style={[
            styles.dashed,
            { backgroundColor: kollab.color.cardSoft, borderColor: kollab.color.outline },
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, { color: kollab.color.ink }]}>+ Add {itemWord}</Text>
        </Pressable>
        <Pressable
          onPress={() => void shareStorefront()}
          style={[styles.share, { borderColor: kollab.color.ink }]}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, { color: kollab.color.ink }]}>Share link</Text>
        </Pressable>
      </View>

      {shareUrl ? (
        <Pressable onPress={() => void Linking.openURL(shareUrl)} style={styles.liveLink}>
          <Text style={[styles.liveLinkText, { color: kollab.color.violet }]} numberOfLines={1}>
            {shareUrl}
          </Text>
        </Pressable>
      ) : null}
    </ScrollScreen>
  );
}

function CatalogPhotoRow({
  product,
  meta,
  catalogCover,
  onPress,
}: {
  product: CatalogProduct;
  meta: string;
  catalogCover?: string | null;
  onPress: () => void;
}) {
  const kollab = useKollab();
  const cover = productCover(product, catalogCover);
  return (
    <Pressable onPress={onPress} style={stylesRow.row} accessibilityRole="button">
      <View style={[stylesRow.thumb, { backgroundColor: kollab.color.imgBg }]}>
        {cover ? (
          <Image source={cover} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : null}
        <LinearGradient
          colors={kollab.scrimStops.tile.colors as [string, string]}
          locations={kollab.scrimStops.tile.locations as [number, number]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[stylesRow.price, { backgroundColor: kollab.color.chartreuse }]}>
          <Text style={[stylesRow.priceText, { color: kollab.color.onChartreuse }]}>
            {formatInr(product.price)}
          </Text>
        </View>
      </View>
      <View style={stylesRow.copy}>
        <Text style={[stylesRow.name, { color: kollab.color.ink }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[stylesRow.meta, { color: kollab.color.ink }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}

const stylesRow = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  price: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceText: {
    fontFamily: font.bold,
    fontSize: 10.5,
  },
  copy: { flex: 1, minWidth: 0 },
  name: {
    ...kType.rowTitle,
  },
  meta: {
    fontFamily: font.body,
    fontSize: 12,
    opacity: 0.55,
    marginTop: 4,
  },
});

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        headPad: {
          paddingHorizontal: space.gutter,
          paddingTop: 2,
        },
        chips: {
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: space.gutter,
          paddingBottom: 16,
        },
        chip: {
          borderWidth: 1.5,
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 20,
        },
        chipText: {
          fontFamily: font.semiBold,
          fontSize: 13,
        },
        card: {
          marginHorizontal: space.cardGutter,
          marginBottom: 16,
          borderRadius: 24,
          overflow: 'hidden',
        },
        cardHead: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 18,
          paddingTop: 18,
        },
        cardHeadCopy: { flex: 1, minWidth: 0 },
        count: {
          ...kType.sectionTitle,
        },
        hint: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.55,
          marginTop: 3,
          lineHeight: 17,
        },
        status: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          paddingVertical: 6,
          paddingHorizontal: 12,
          flexShrink: 0,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 99,
        },
        statusText: {
          fontFamily: font.bold,
          fontSize: 10.5,
          letterSpacing: 0.84,
          textTransform: 'uppercase',
        },
        feedback: {
          fontFamily: font.body,
          fontSize: 12.5,
          lineHeight: 18,
          opacity: 0.75,
          paddingHorizontal: 18,
          marginTop: 10,
        },
        rows: {
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 16,
        },
        emptyRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 16,
        },
        emptyThumb: {
          width: 78,
          height: 78,
          borderRadius: 14,
        },
        emptyCopy: { flex: 1, minWidth: 0 },
        emptyTitle: {
          ...kType.rowTitle,
        },
        cta: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 18,
          paddingHorizontal: 20,
        },
        ctaText: {
          fontFamily: font.semiBold,
          fontSize: 14.5,
        },
        ctaCaret: {
          fontFamily: font.body,
          fontSize: 17,
          opacity: 0.55,
        },
        actions: {
          flexDirection: 'row',
          gap: 9,
          paddingHorizontal: space.cardGutter,
        },
        dashed: {
          flex: 1,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderRadius: 20,
          paddingVertical: 17,
          alignItems: 'center',
        },
        share: {
          flex: 1,
          borderWidth: 1.5,
          borderRadius: 20,
          paddingVertical: 17,
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
        actionText: {
          fontFamily: font.semiBold,
          fontSize: 13.5,
        },
        liveLink: {
          paddingHorizontal: space.gutter,
          paddingTop: 12,
        },
        liveLinkText: {
          fontFamily: font.body,
          fontSize: 12,
        },
        errorTitle: {
          ...kType.sectionTitle,
          padding: 18,
          paddingBottom: 6,
        },
      }),
    [kollab]
  );
}
