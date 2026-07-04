import React, { useCallback, useId, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { radius, shadow } from '@/theme';
import { fonts } from '@/components/ui/typography';
import {
  MY_STATS_DESIGN,
  POST_HERO_CANVAS,
  myStatsHeroHeight,
  myStatsScaleX,
} from '@/lib/my-stats-mock-layout';

const POST_HERO = require('@/assets/post.png');

type Props = {
  onAnalyticsPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function HeroDotGrid() {
  const uid = useId().replace(/:/g, '');
  const patternId = `postHeroDots_${uid}`;
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

export function MyStatsHeroCard({ onAnalyticsPress, style }: Props) {
  const [cardWidth, setCardWidth] = useState<number>(MY_STATS_DESIGN.cardWidth);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setCardWidth(w);
  }, []);

  const cardHeight = myStatsHeroHeight(cardWidth);
  const artWidth = cardHeight * MY_STATS_DESIGN.postAspect;
  const textMaxWidth = cardWidth * 0.52;
  const sx = (px: number) => myStatsScaleX(cardWidth, px);

  return (
    <View
      style={[styles.shell, shadow.card, { height: cardHeight }, style]}
      onLayout={onLayout}
    >
      <LinearGradient
        colors={[...POST_HERO_CANVAS.gradient]}
        locations={[...POST_HERO_CANVAS.gradientLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <HeroDotGrid />

      <View style={[styles.heroArtWrap, { width: artWidth, height: cardHeight }]} pointerEvents="none">
        <Image source={POST_HERO} style={styles.heroArt} resizeMode="contain" />
      </View>

      <LinearGradient
        colors={[
          POST_HERO_CANVAS.solid,
          `rgba(${POST_HERO_CANVAS.rgb}, 0.55)`,
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
            left: sx(18),
            paddingTop: sx(28),
            paddingBottom: sx(18),
          },
        ]}
      >
        <View style={styles.copyBlock}>
          <View style={styles.overlinePill}>
            <Text style={styles.overline} numberOfLines={1}>
              YOUR PERFORMANCE
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            Track. Analyze. Grow.
          </Text>

          <Text style={styles.subtitle} numberOfLines={1}>
            Real Time Insights
          </Text>
        </View>

        <TouchableOpacity
          style={styles.glassBtnOuter}
          onPress={onAnalyticsPress}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Analytics Overview"
        >
          <Text style={styles.glassBtnText}>Analytics Overview</Text>
          <Ionicons name="chevron-forward" size={12} color="#FFFFFF" style={styles.chevron} />
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    fontSize: 7,
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.55)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.5,
    lineHeight: 24,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.62)',
  },
  glassBtnOuter: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  glassBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  chevron: {
    marginLeft: 2,
    opacity: 0.9,
  },
});
