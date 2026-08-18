import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Share,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, useAppShell, appShellLight as appShell } from '@/theme';
import { fonts } from './typography';
import { PrimaryButton } from './PrimaryButton';
import {
  catalogProductCount,
  flattenCatalogProducts,
  buildCategoryByProductId,
  productImageUrl,
  type CatalogProduct,
  type InfluencerCatalog,
} from '@/lib/catalog-api';
import { formatHomeInr } from '@/lib/home-potential-earnings';
import { showPremiumToast } from './PremiumToast';

type Props = {
  catalog: InfluencerCatalog | null;
  loading?: boolean;
  onOpenCatalog: () => void;
  style?: StyleProp<ViewStyle>;
};

const MAX_TILES = 4;

function buildShareUrl(catalog?: InfluencerCatalog | null): string | null {
  const live = catalog?.liveStoreUrl?.trim();
  if (live) return live;
  // Bridge off / not yet approved: no public Affiliate storefront in Phase 1
  return null;
}

function statusCopy(status?: string | null): string {
  switch (status) {
    case 'approved':
      return 'Live storefront';
    case 'pending_approval':
      return 'Pending approval';
    case 'rejected':
      return 'Needs changes';
    case 'draft':
      return 'Draft';
    default:
      return 'Not set up';
  }
}

/** Preview-grid slice: available products only, capped to MAX_TILES. */
function flattenProducts(catalog: InfluencerCatalog | null): CatalogProduct[] {
  return flattenCatalogProducts(catalog)
    .filter((p) => p.isAvailable !== false)
    .slice(0, MAX_TILES);
}

function ProductTile({
  product,
  categoryHint,
  onPress,
}: {
  product: CatalogProduct;
  categoryHint?: string;
  onPress: () => void;
}) {
  const imageUrl = productImageUrl(product);
  const shell = useAppShell();
  return (
    <Pressable
      onPress={onPress}
      style={styles.tile}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatHomeInr(product.price)}`}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            recyclingKey={product.id}
          />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: shell.canvasAlt }]}>
            <Text style={[styles.imageFallbackLetter, { color: shell.cta }]}>
              {(product.name || 'P').slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.72)']}
          style={styles.imageGradient}
        />
        <Text style={styles.priceOverlay} numberOfLines={1}>
          {formatHomeInr(product.price)}
        </Text>
      </View>
      <Text style={[styles.productName, { color: shell.textPrimary }]} numberOfLines={1}>
        {product.name}
      </Text>
      {categoryHint ? (
        <Text style={[styles.productMeta, { color: shell.textSecondary }]} numberOfLines={1}>
          {categoryHint}
        </Text>
      ) : null}
    </Pressable>
  );
}

function PlaceholderTile({ onPress, itemLabel }: { onPress: () => void; itemLabel: string }) {
  const shell = useAppShell();
  return (
    <Pressable
      onPress={onPress}
      style={styles.tile}
      accessibilityRole="button"
      accessibilityLabel={`Add ${itemLabel}`}
    >
      <View
        style={[
          styles.imageWrap,
          styles.placeholderImage,
          { backgroundColor: shell.canvasAlt, borderColor: shell.cardBorder },
        ]}
      >
        <Text style={[styles.placeholderHint, { color: shell.cta }]}>{`Add ${itemLabel}`}</Text>
      </View>
      <Text
        style={[styles.productNamePlaceholder, { color: shell.textSecondary }]}
        numberOfLines={1}
      >
        {`Your ${itemLabel}`}
      </Text>
      <Text style={[styles.productMeta, { color: shell.textSecondary }]} numberOfLines={1}>
        Tap to set up
      </Text>
    </Pressable>
  );
}

/** Instamart-style 2-column storefront preview with Share when approved. */
export function HomeCatalogPreviewCard({ catalog, loading, onOpenCatalog, style }: Props) {
  const shell = useAppShell();
  const productCount = catalogProductCount(catalog);
  const approved = catalog?.status === 'approved';
  const shareUrl = approved ? buildShareUrl(catalog) : null;
  const isServiceCatalog = catalog?.businessType === 'services';
  const itemLabel = isServiceCatalog ? 'service' : 'product';
  const itemLabelPlural = isServiceCatalog ? 'services' : 'products';

  const products = useMemo(() => flattenProducts(catalog), [catalog]);

  const categoryByProductId = useMemo(() => buildCategoryByProductId(catalog), [catalog]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) {
      showPremiumToast({
        title: 'Storefront not ready',
        message: 'Finish setup and get approval before sharing.',
        durationMs: 2400,
      });
      return;
    }
    try {
      await Share.share({
        message: `Check out my storefront: ${shareUrl}`,
        url: shareUrl,
        title: catalog?.storeName || 'My Storefront',
      });
    } catch {
      showPremiumToast({
        title: 'Share failed',
        message: 'Could not open the share sheet. Try again.',
        durationMs: 2200,
      });
    }
  }, [shareUrl, catalog?.storeName]);

  const ctaLabel = !catalog
    ? 'Set up storefront'
    : catalog.status === 'pending_approval'
      ? 'View status'
      : catalog.status === 'approved'
        ? shareUrl
          ? 'Share storefront'
          : 'Open storefront'
        : 'Continue setup';

  const onCtaPress = approved && shareUrl ? () => void handleShare() : onOpenCatalog;

  return (
    <View
      style={[styles.shell, { backgroundColor: shell.card, borderColor: shell.cardBorder }, style]}
    >
      <Pressable
        onPress={onOpenCatalog}
        style={styles.headerRow}
        accessibilityRole="button"
        accessibilityLabel="Open storefront"
      >
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: shell.textPrimary }]}>My Storefront</Text>
          {catalog?.storeName ? (
            <Text style={[styles.storeSub, { color: shell.textSecondary }]} numberOfLines={1}>
              {catalog.storeName}
              {productCount > 0
                ? ` · ${productCount} ${productCount === 1 ? itemLabel : itemLabelPlural}`
                : ''}
            </Text>
          ) : null}
        </View>
        <View style={[styles.statusPill, { backgroundColor: shell.iceBlue }]}>
          <Text style={[styles.statusPillText, { color: shell.cta }]}>
            {loading && !catalog ? 'Loading' : statusCopy(catalog?.status)}
          </Text>
        </View>
      </Pressable>

      <View style={styles.grid}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductTile
              key={product.id}
              product={product}
              categoryHint={categoryByProductId.get(product.id)}
              onPress={onOpenCatalog}
            />
          ))
        ) : (
          <>
            <PlaceholderTile onPress={onOpenCatalog} itemLabel={itemLabel} />
            <PlaceholderTile onPress={onOpenCatalog} itemLabel={itemLabel} />
          </>
        )}
      </View>

      <PrimaryButton label={ctaLabel} onPress={onCtaPress} compact pill />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 30,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.35,
    color: appShell.textPrimary,
  },
  storeSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: appShell.iceBlue,
  },
  statusPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.cta,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: '47.5%',
    gap: 6,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 30, 51, 0.06)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.cta,
  },
  imageFallbackLetter: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  priceOverlay: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    right: 10,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  productName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: -0.2,
    color: appShell.textPrimary,
  },
  productNamePlaceholder: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: appShell.textSecondary,
  },
  productMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  placeholderImage: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(20, 30, 51, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142, 158, 237, 0.1)',
  },
  placeholderHint: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.cta,
  },
});
