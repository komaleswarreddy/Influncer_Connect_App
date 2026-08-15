import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Share,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useHomeDesign, homeFonts } from '@/theme/homeDesign';
import { HomeSectionLabel } from './HomeSectionLabel';
import { showPremiumToast } from './PremiumToast';
import {
  catalogProductCount,
  type CatalogProduct,
  type InfluencerCatalog,
} from '@/lib/catalog-api';
import { formatHomeInr } from '@/lib/home-potential-earnings';

export type StorefrontTabKey = 'products' | 'services';

type Props = {
  catalog: InfluencerCatalog | null;
  loading?: boolean;
  /** Only tabs whose catalog has been started are shown. */
  availableTabs: StorefrontTabKey[];
  activeTab: StorefrontTabKey;
  onChangeTab: (tab: StorefrontTabKey) => void;
  onOpenCatalog: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Ribbon reflects publish state — LIVE only once Ops has approved the catalog. */
function ribbonFor(status?: string | null): { label: string; live: boolean } {
  switch (status) {
    case 'approved':
      return { label: 'LIVE', live: true };
    case 'pending_approval':
      return { label: 'IN REVIEW', live: false };
    case 'rejected':
      return { label: 'CHANGES', live: false };
    default:
      return { label: 'DRAFT', live: false };
  }
}

function footerLabelFor(status: string | null | undefined, canShare: boolean): string {
  if (status === 'approved') return canShare ? 'Share storefront' : 'Open storefront';
  if (status === 'pending_approval') return 'View status';
  return 'Continue setup';
}

function firstProduct(catalog: InfluencerCatalog | null): CatalogProduct | null {
  for (const cat of catalog?.categories ?? []) {
    for (const p of cat.products ?? []) {
      if (p.isAvailable !== false) return p;
    }
  }
  return null;
}

function categoryNameFor(catalog: InfluencerCatalog | null, productId?: string): string | null {
  if (!productId) return null;
  for (const cat of catalog?.categories ?? []) {
    if ((cat.products ?? []).some((p) => p.id === productId)) return cat.name;
  }
  return null;
}

function Chevron({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m9 18 6-6-6-6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** My Storefront — pill tabs + hero item + dark action footer, per the Final Home Screen mock. */
export function HomeStorefrontCard({
  catalog,
  loading,
  availableTabs,
  activeTab,
  onChangeTab,
  onOpenCatalog,
  style,
}: Props) {
  const d = useHomeDesign();
  const isServices = activeTab === 'services';
  const count = catalogProductCount(catalog);
  const itemWord = isServices ? 'service' : 'product';
  const ribbon = ribbonFor(catalog?.status);
  const shareUrl = catalog?.status === 'approved' ? catalog?.liveStoreUrl?.trim() || null : null;

  const hero = useMemo(() => firstProduct(catalog), [catalog]);
  const heroCategory = useMemo(() => categoryNameFor(catalog, hero?.id), [catalog, hero?.id]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;
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

  const footerLabel = footerLabelFor(catalog?.status, Boolean(shareUrl));
  const onFooterPress = shareUrl ? () => void handleShare() : onOpenCatalog;

  return (
    <View style={style}>
      <HomeSectionLabel label="My Storefront" />

      {availableTabs.length > 1 ? (
        <View style={[styles.tabBar, { backgroundColor: d.tint }]}>
          {availableTabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => onChangeTab(tab)}
                style={({ pressed }) => [
                  styles.tab,
                  active && { backgroundColor: d.ink },
                  pressed && styles.tabPressed,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, { color: active ? d.onInk : d.mut }]}>
                  {tab === 'products' ? 'Products' : 'Services'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Pressable
        onPress={onOpenCatalog}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: d.surf,
            borderColor: d.line,
            shadowColor: d.shadowColor,
            shadowOpacity: d.shadowOpacity,
          },
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open storefront"
      >
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: d.ink }]} numberOfLines={1}>
              {count} {count === 1 ? itemWord : `${itemWord}s`}
            </Text>
            <View
              style={[styles.ribbon, { backgroundColor: ribbon.live ? d.pillBg : d.pillBgIdle }]}
            >
              <View
                style={[
                  styles.ribbonDot,
                  { backgroundColor: ribbon.live ? d.pillFg : d.pillFgIdle },
                ]}
              />
              <Text style={[styles.ribbonText, { color: ribbon.live ? d.pillFg : d.pillFgIdle }]}>
                {ribbon.label}
              </Text>
            </View>
          </View>

          {loading && !catalog ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={d.ink} />
            </View>
          ) : (
            <View style={styles.heroRow}>
              <View style={[styles.thumb, { borderColor: d.line, backgroundColor: d.tint }]}>
                {hero?.imageUrl ? (
                  <Image
                    source={{ uri: hero.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    recyclingKey={hero.id}
                  />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Text style={[styles.thumbLetter, { color: d.mut }]}>
                      {(hero?.name || catalog?.storeName || 'S').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                {hero ? (
                  <View style={[styles.priceTag, { backgroundColor: d.ink }]}>
                    <Text style={[styles.priceText, { color: d.onInk }]}>
                      {formatHomeInr(hero.price)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.heroCopy}>
                <Text style={[styles.heroName, { color: d.ink }]} numberOfLines={2}>
                  {hero?.name || catalog?.storeName || `Add your first ${itemWord}`}
                </Text>
                <Text style={[styles.heroMeta, { color: d.mut }]} numberOfLines={1}>
                  {heroCategory || (isServices ? 'Services' : 'Products')}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Pressable
          onPress={onFooterPress}
          style={[styles.footer, { backgroundColor: d.ink }]}
          accessibilityRole="button"
          accessibilityLabel={footerLabel}
        >
          <Text style={[styles.footerText, { color: d.onInk }]}>{footerLabel}</Text>
          <Chevron color={d.onInk} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  tabPressed: {
    transform: [{ scale: 0.95 }],
  },
  tabText: {
    fontFamily: homeFonts.bold,
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  body: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: homeFonts.displayBold,
    fontSize: 19,
    letterSpacing: -0.5,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingLeft: 9,
    paddingRight: 11,
    paddingVertical: 5,
  },
  ribbonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ribbonText: {
    fontFamily: homeFonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.95,
  },
  loadingWrap: {
    height: 96,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLetter: {
    fontFamily: homeFonts.displayBold,
    fontSize: 30,
  },
  priceTag: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priceText: {
    fontFamily: homeFonts.bold,
    fontSize: 12,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontFamily: homeFonts.displaySemiBold,
    fontSize: 19,
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontFamily: homeFonts.medium,
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footerText: {
    fontFamily: homeFonts.bold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
});
