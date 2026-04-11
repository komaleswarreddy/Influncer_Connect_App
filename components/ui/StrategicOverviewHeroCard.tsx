import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ImageBackground,
  type StyleProp,
  type ViewStyle,
  type ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radius, shadow, premiumNavy } from '@/theme';
import { fonts } from './typography';

type Props = {
  overline: string;
  title: string;
  subtitle: string;
  metricValue: string;
  metricLabel: string;
  detailsLabel?: string;
  onDetailsPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Optional art (e.g. `require('../assets/grand_navy_gradient_dashboard.png')`) — tinted so copy stays legible */
  backgroundImage?: ImageSourcePropType;
};

/** Grand navy gradient hero — layered fades + glass CTA (reference: premium creator dashboard). */
export function StrategicOverviewHeroCard({
  overline,
  title,
  subtitle,
  metricValue,
  metricLabel,
  detailsLabel = 'More Details',
  onDetailsPress,
  style,
  backgroundImage,
}: Props) {
  return (
    <View style={[styles.shell, shadow.card, style]}>
      {backgroundImage ? (
        <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} resizeMode="cover">
          <LinearGradient
            colors={[...premiumNavy.imageOverlay.colors]}
            locations={[...premiumNavy.imageOverlay.locations]}
            start={premiumNavy.imageOverlay.start}
            end={premiumNavy.imageOverlay.end}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[...premiumNavy.base.colors]}
          locations={[...premiumNavy.base.locations]}
          start={premiumNavy.base.start}
          end={premiumNavy.base.end}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Top-left radial-style sheen (linear approximation) */}
      <LinearGradient
        colors={[...premiumNavy.sheen.colors]}
        locations={[...premiumNavy.sheen.locations]}
        start={premiumNavy.sheen.start}
        end={premiumNavy.sheen.end}
        style={[StyleSheet.absoluteFill, styles.sheen]}
        pointerEvents="none"
      />
      {/* Cool rim light at bottom for depth */}
      <LinearGradient
        colors={[...premiumNavy.bottomTint.colors]}
        start={premiumNavy.bottomTint.start}
        end={premiumNavy.bottomTint.end}
        style={[StyleSheet.absoluteFill, styles.bottomTint]}
        pointerEvents="none"
      />
      <View style={styles.inner}>
        <Text style={styles.overline}>{overline}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>

        <View style={styles.heroRow}>
          <View style={styles.heroMetric}>
            <Text
              style={styles.heroMetricValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              allowFontScaling
            >
              {metricValue}
            </Text>
            <Text style={styles.heroMetricLabel}>{metricLabel}</Text>
          </View>
          <TouchableOpacity
            style={styles.glassBtnOuter}
            onPress={onDetailsPress}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)']}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.glassBtnFill}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'transparent']}
                locations={[0, 0.55]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.glassBtnGloss]}
                pointerEvents="none"
              />
              <Text style={styles.glassBtnText}>{detailsLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shadow.card,
  },
  sheen: {
    opacity: 0.95,
  },
  bottomTint: {
    opacity: 0.9,
  },
  inner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  overline: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    letterSpacing: 1.35,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    lineHeight: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.68)',
    marginBottom: spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroMetric: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  heroMetricValue: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 42,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  heroMetricLabel: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  /** Glass pill — reads clearly on navy; distinct from card gradient */
  glassBtnOuter: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  glassBtnFill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 112,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassBtnGloss: {
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  glassBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    zIndex: 1,
  },
});
