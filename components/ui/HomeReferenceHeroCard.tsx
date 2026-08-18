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
import { useKollab, radius as kollabRadius, font } from '@/theme/kollab-tokens';
import { HOME_DESIGN, HERO_STATS_CANVAS, heroCardHeight, scaleX } from '@/lib/home-mock-layout';

const HERO_STATS = require('@/assets/hero_stats.png');

type Props = {
  /** Formatted reach or "—" */
  totalReach: string;
  hasReach: boolean;
  /** Any social OAuth connected — shows connected hero copy when reach is still loading. */
  accountsConnected?: boolean;
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
            <Circle cx={7} cy={7} r={1} fill="rgba(221, 233, 106, 0.18)" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}

/** Home hero — live total reach only (no invented marketing numbers). */
export function HomeReferenceHeroCard({
  totalReach,
  hasReach,
  accountsConnected = false,
  onDetailsPress,
  style,
}: Props) {
  const kollab = useKollab();
  const [cardWidth, setCardWidth] = useState(HOME_DESIGN.cardWidth);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setCardWidth(w);
  }, []);

  const cardHeight = heroCardHeight(cardWidth);
  const artWidth = cardHeight * HOME_DESIGN.heroStatsAspect;
  const showConnectedPitch = accountsConnected && !hasReach;
  const textMaxWidth = cardWidth * (hasReach ? 0.46 : showConnectedPitch ? 0.54 : 0.56);
  const sx = (px: number) => scaleX(cardWidth, px);

  return (
    <View
      style={[styles.shell, kollab.shadow.card, { height: cardHeight }, style]}
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

      <View
        style={[styles.heroArtWrap, { width: artWidth, height: cardHeight }]}
        pointerEvents="none"
      >
        <Image source={HERO_STATS} style={styles.heroArt} resizeMode="contain" />
      </View>

      <LinearGradient
        colors={[HERO_STATS_CANVAS.solid, `rgba(${HERO_STATS_CANVAS.rgb}, 0.55)`, 'transparent']}
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
              {showConnectedPitch ? 'CREATOR DASHBOARD' : 'STRATEGIC OVERVIEW'}
            </Text>
          </View>

          {showConnectedPitch ? (
            <>
              <Text style={styles.connectedHeadline} numberOfLines={2}>
                Track. Grow.{'\n'}
                <Text style={styles.connectedHeadlineAccent}>Earn More.</Text>
              </Text>
              <Text style={styles.connectedSubline} numberOfLines={2}>
                Real insights, better collaborations.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title} numberOfLines={1}>
                Your Stats
              </Text>

              <Text style={styles.metricLabel}>Total Reach</Text>

              {hasReach ? (
                <Text
                  style={styles.metricValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {totalReach}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={onDetailsPress}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel="Link Accounts"
                  style={[
                    styles.connectBtn,
                    styles.connectBtnUnderLabel,
                    {
                      backgroundColor: kollab.color.chartreuse,
                      borderColor: 'rgba(221,233,106,0.55)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.connectBtnInnerGlow,
                      {
                        borderColor: 'rgba(221,233,106,0.25)',
                        backgroundColor: 'rgba(221,233,106,0.08)',
                      },
                    ]}
                    pointerEvents="none"
                  />
                  <Text
                    style={[styles.connectBtnText, { color: kollab.color.onChartreuse }]}
                    numberOfLines={1}
                  >
                    Link Accounts
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={kollab.color.onChartreuse}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: kollabRadius.cardL,
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
    justifyContent: 'flex-start',
  },
  copyBlock: {
    gap: 0,
  },
  overlinePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: kollabRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  overline: {
    fontFamily: font.semiBold,
    fontSize: 8,
    letterSpacing: 1.1,
    color: 'rgba(255, 255, 255, 0.55)',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: font.bold,
    fontSize: 24,
    letterSpacing: -0.6,
    lineHeight: 30,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  connectedHeadline: {
    fontFamily: font.bold,
    fontSize: 22,
    letterSpacing: -0.55,
    lineHeight: 28,
    color: '#FFFFFF',
    marginBottom: 8,
    maxWidth: '100%',
  },
  connectedHeadlineAccent: {
    fontFamily: font.bold,
    fontSize: 22,
    letterSpacing: -0.55,
    lineHeight: 28,
    color: '#DDE96A',
  },
  connectedSubline: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.58)',
    marginBottom: 4,
    maxWidth: '100%',
  },
  metricLabel: {
    fontFamily: font.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: font.bold,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 38,
    maxWidth: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  /** Empty-state CTA: chartreuse fill, ink text, soft chartreuse glow */
  connectBtnUnderLabel: {
    marginTop: 14,
    marginBottom: 4,
  },
  connectBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexWrap: 'nowrap',
    position: 'relative',
    overflow: 'visible',
    borderRadius: kollabRadius.pill,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 12,
    marginRight: 8,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#DDE96A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
        shadowColor: '#DDE96A',
      },
      default: {},
    }),
  },
  /** Soft inset wash — RN has no inset box-shadow */
  connectBtnInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: kollabRadius.pill,
    borderWidth: 1,
  },
  connectBtnText: {
    fontFamily: font.bold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.05,
    flexShrink: 0,
    zIndex: 1,
  },
  chevron: {
    marginLeft: 5,
    opacity: 0.95,
    zIndex: 1,
  },
});
