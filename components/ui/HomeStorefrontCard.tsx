import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useKollab, font, choiceChipColors, type as kType } from '@/theme/kollab-tokens';
import {
  catalogHeroImageUrl,
  catalogImageSource,
  catalogProductCount,
  type InfluencerCatalog,
} from '@/lib/catalog-api';

export type StorefrontTabKey = 'products' | 'services';

type Props = {
  productsCatalog: InfluencerCatalog | null;
  servicesCatalog: InfluencerCatalog | null;
  onOpenCatalog: () => void;
  style?: StyleProp<ViewStyle>;
};

function ribbonFor(status?: string | null) {
  if (status === 'approved') return { label: 'LIVE', live: true };
  if (status === 'pending_approval') return { label: 'IN REVIEW', live: false };
  return { label: 'DRAFT', live: false };
}

export function HomeStorefrontCard({
  productsCatalog,
  servicesCatalog,
  onOpenCatalog,
  style,
}: Props) {
  const kollab = useKollab();
  const [tab, setTab] = useState<StorefrontTabKey>('products');
  const catalog = tab === 'services' ? servicesCatalog : productsCatalog;
  const count = catalogProductCount(catalog);
  const itemWord = tab === 'services' ? 'service' : 'product';
  const ribbon = ribbonFor(catalog?.status);
  const ribbonTone = ribbon.live ? kollab.statusChip.live : kollab.statusChip.neutral;
  const cover = catalogImageSource(catalogHeroImageUrl(catalog));

  const tabs = useMemo(() => {
    const t: StorefrontTabKey[] = [];
    if (productsCatalog) t.push('products');
    if (servicesCatalog) t.push('services');
    if (t.length === 0) return ['products', 'services'] as StorefrontTabKey[];
    return t;
  }, [productsCatalog, servicesCatalog]);

  return (
    <View style={style}>
      <View style={styles.head}>
        <Text style={[styles.heading, { color: kollab.color.ink }]}>My storefront</Text>
        <Pressable onPress={onOpenCatalog} accessibilityRole="button">
          <Text style={[styles.open, { color: kollab.color.violetDeep }]}>open →</Text>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {tabs.map((t) => {
          const on = t === tab;
          const chip = choiceChipColors(kollab, on);
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.chip,
                {
                  backgroundColor: chip.backgroundColor,
                  borderColor: chip.borderColor,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: chip.color }]}>
                {t === 'products' ? 'Products' : 'Services'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={onOpenCatalog}
        style={[styles.hero, { backgroundColor: kollab.color.imgBg }]}
        accessibilityRole="button"
        accessibilityLabel="Open storefront"
      >
        {cover ? (
          <Image source={cover} style={StyleSheet.absoluteFillObject} contentFit="contain" />
        ) : null}
        <LinearGradient
          colors={kollab.scrimStops.card.colors as [string, string, string]}
          locations={kollab.scrimStops.card.locations as [number, number, number]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.ribbon, { backgroundColor: ribbonTone.bg }]}>
          <View style={[styles.dot, { backgroundColor: ribbonTone.fg }]} />
          <Text style={[styles.ribbonText, { color: ribbonTone.fg }]}>{ribbon.label}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.count}>
            {count} {count === 1 ? itemWord : `${itemWord}s`}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {count > 0
              ? catalog?.storeName || 'Your storefront'
              : `Add ${itemWord}s to your storefront`}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 10,
  },
  heading: {
    ...kType.sectionTitle,
  },
  open: {
    fontFamily: font.bold,
    fontSize: 12.5,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  chipText: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
  },
  hero: {
    marginHorizontal: 18,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    top: 13,
    right: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 99 },
  ribbonText: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroCopy: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 15,
  },
  count: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  title: {
    fontFamily: font.display,
    fontSize: 23,
    lineHeight: 27,
    color: '#FFFFFF',
    marginTop: 4,
  },
});
