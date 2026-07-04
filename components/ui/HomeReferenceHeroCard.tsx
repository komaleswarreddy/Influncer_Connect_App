import React, { useCallback, useId, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { radius, shadow } from '@/theme';
import { fonts } from './typography';
import {
  HOME_DESIGN,
  HERO_STATS_CANVAS,
  heroCardHeight,
  scaleX,
} from '@/lib/home-mock-layout';

const HERO_STATS = require('@/assets/hero_stats.png');

type Props = {
  ecosystemReach: string;
  onDetailsPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function HeroDotGrid() {
  const uid = useId().replace(/:/g, '');
  const patternId = `heroDots_${uid}`;
  return (
    <View style={styles.dotWrap} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={14} height={14}>
            <Circle cx={7} cy={7} r={1} fill="rgba(80, 130, 255, 0.14)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}

/** Reference mock hero — navy canvas, hero_stats on right, live copy overlaid left. */
export function HomeReferenceHeroCard({
  ecosystemReach,
  onDetailsPress,
  style,
}: Props) {
  const [cardWidth, setCardWidth] = useState(HOME_DESIGN.cardWidth);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setCardWidth(w);
  }, []);

  const cardHeight = heroCardHeight(cardWidth);
  const artWidth = cardHeight * HOME_DESIGN.heroStatsAspect;
  const textMaxWidth = cardWidth * 0.52;
  const sx = (px: number) => scaleX(cardWidth, px);

  return (
    <View
      style={[styles.shell, shadow.card, { height: cardHeight }, style]}
      onLayout={onLayout}
    >
      <LinearGradient
        colors={[...HERO_STATS_CANVAS.gradient]}
        locations={[...HERO_STATS_CANVAS.gradientLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <HeroDotGrid />

      <View style={[styles.heroArtWrap, { width: artWidth, height: cardHeight }]} pointerEvents="none">
        <Image source={HERO_STATS} style={styles.heroArt} resizeMode="contain" />
      </View>

      <LinearGradient
        colors={[
          HERO_STATS_CANVAS.solid,
          `rgba(${HERO_STATS_CANVAS.rgb}, 0.55)`,
          'transparent',
        ]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.seamFade, { width: sx(120) }]}
        pointerEvents="none"
      />

      <View
        style={[
          styles.textCol,
          {
            width: textMaxWidth,
            height: cardHeight,
            left: sx(20),
            paddingTop: sx(34),
            paddingBottom: sx(22),
          },
        ]}
      >
        <View style={styles.copyBlock}>
          <View style={styles.overlinePill}>
            <Text style={styles.overline} numberOfLines={1}>
              STRATEGIC OVERVIEW
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            Your Stats
          </Text>

          <Text style={styles.metricLabel}>Ecosystem Reach</Text>

          <Text
            style={styles.metricValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {ecosystemReach}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.glassBtnOuter}
          onPress={onDetailsPress}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="More Details"
        >
          <Text style={styles.glassBtnText}>More Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={styles.chevron} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  dotWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 88,
    opacity: 0.85,
    zIndex: 2,
  },
  heroArtWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
  heroArt: {
    width: '100%',
    height: '100%',
  },
  seamFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  textCol: {
    position: 'absolute',
    zIndex: 3,
    justifyContent: 'space-between',
  },
  copyBlock: {
    gap: 0,
  },
  overlinePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  overline: {
    fontFamily: fonts.semiBold,
    fontSize: 8,
    letterSpacing: 1.1,
    color: 'rgba(255, 255, 255, 0.55)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 30,
    color: '#FFFFFF',
    marginBottom: 14,
  },
  metricLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight: 42,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  glassBtnOuter: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingLeft: 14,
    paddingRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  glassBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  chevron: {
    marginLeft: 2,
    opacity: 0.9,
  },
});
