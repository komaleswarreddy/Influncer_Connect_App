import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useKollab, uniformCard, font } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

type Badge = { label: string; bg: string; fg: string };
type BrandBadge = { logo: string; logoBg: string; brand: string };

type Props = {
  cover: ImageSource | number;
  title: string;
  meta?: string;
  payLabel?: string;
  /** Top-left brand chip (logo circle + name) — omit for contexts with no brand (e.g. UGC briefs). */
  brand?: BrandBadge;
  /** Top-right status pill (e.g. "Active", "Live", "Open"). */
  status?: Badge;
  /** Kept for callers; layout size is uniform so mixed niches don't stagger. */
  shape?: keyof KollabTokens['cardShape'];
  /** 'list' = full-width feed card. 'rail' = horizontal-scroll card. */
  variant?: 'list' | 'rail';
  /** Override width (rail defaults to uniformCard.railWidth). */
  width?: number;
  /** Override height (list/rail use uniformCard). */
  height?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Photo-forward card — the mockup's signature surface for campaigns, catalog items, and briefs.
 *  Full-bleed cover, gradient scrim, brand + status badges floating top, title/meta/price bottom. */
export function PhotoCard({
  cover,
  title,
  meta,
  payLabel,
  brand,
  status,
  variant = 'list',
  width,
  height,
  onPress,
  style,
}: Props) {
  const kollab = useKollab();
  const dims =
    variant === 'rail'
      ? { width: width ?? uniformCard.railWidth, height: height ?? uniformCard.railHeight }
      : { width: width ?? '100%', height: height ?? uniformCard.listHeight };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: dims.width as number | `${number}%`,
          height: dims.height,
          borderRadius:
            variant === 'list' ? uniformCard.listBorderRadius : uniformCard.borderRadius,
          backgroundColor: kollab.color.imgBg,
          shadowColor: kollab.shadow.photoCard.shadowColor,
          shadowOffset: kollab.shadow.photoCard.shadowOffset,
          shadowOpacity: kollab.shadow.photoCard.shadowOpacity,
          shadowRadius: kollab.shadow.photoCard.shadowRadius,
          elevation: kollab.shadow.photoCard.elevation,
        },
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Image source={cover} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <LinearGradient
        colors={kollab.scrimStops.card.colors as [string, string, string]}
        locations={kollab.scrimStops.card.locations as [number, number, number]}
        style={StyleSheet.absoluteFillObject}
      />

      {brand ? (
        <View style={styles.brandBadge}>
          <View style={[styles.brandMark, { backgroundColor: brand.logoBg }]}>
            <Text style={styles.brandMarkText}>{brand.logo}</Text>
          </View>
          <Text style={styles.brandName} numberOfLines={1}>
            {brand.brand}
          </Text>
        </View>
      ) : null}

      {status ? (
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.fg }]} numberOfLines={1}>
            {status.label}
          </Text>
        </View>
      ) : null}

      <View style={styles.bottom}>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {payLabel ? (
          <View style={styles.payRow}>
            <View style={[styles.payPill, { backgroundColor: kollab.color.chartreuse }]}>
              <Text style={[styles.payText, { color: kollab.color.onChartreuse }]}>{payLabel}</Text>
            </View>
            <View style={styles.arrowWell}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  brandBadge: {
    position: 'absolute',
    top: 28,
    left: 22,
    maxWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(245,243,237,0.94)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 11,
  },
  brandMark: {
    width: 22,
    height: 22,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    fontFamily: 'InstrumentSans_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  brandName: {
    fontFamily: 'InstrumentSans_700Bold',
    fontSize: 11.5,
    color: '#171410',
    flexShrink: 1,
  },
  statusBadge: {
    position: 'absolute',
    top: 28,
    right: 22,
    maxWidth: '48%',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    fontFamily: 'InstrumentSans_700Bold',
    fontSize: 11,
  },
  bottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  meta: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  title: {
    fontFamily: font.display,
    fontSize: 25,
    lineHeight: 28,
    letterSpacing: -0.9,
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 12,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  payText: {
    fontFamily: 'InstrumentSans_700Bold',
    fontSize: 12.5,
  },
  arrowWell: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 13,
    color: '#171410',
  },
});

export default PhotoCard;
