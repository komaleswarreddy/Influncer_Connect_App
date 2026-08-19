import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useKollab, font } from '@/theme/kollab-tokens';

type TitleSize = 'stack' | 'tab' | 'hero';
type BackTone = 'card' | 'well' | 'frost';

type Props = {
  title: string;
  /** 13px, 0.55 opacity — HTML subtitle under the title. */
  subtitle?: string;
  /** Hide the 34px circular back (tab roots: Home, Collabs, Stats, Account). */
  showBack?: boolean;
  onBack?: () => void;
  /** card = white on surface; well = surface on white sheet; frost = photo overlay. */
  backTone?: BackTone;
  /** stack = 24px (HTML stack screens), tab = 32px, hero = 34px. */
  size?: TitleSize;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const TITLE_SIZE: Record<
  TitleSize,
  { fontSize: number; letterSpacing: number; lineHeight: number }
> = {
  stack: { fontSize: 24, letterSpacing: -0.8, lineHeight: 28 },
  tab: { fontSize: 32, letterSpacing: -1.1, lineHeight: 36 },
  hero: { fontSize: 34, letterSpacing: -1.2, lineHeight: 36 },
};

/**
 * HTML stack chrome: 34×34 circular back + Bricolage Grotesque title.
 * Tab roots omit the back and use `size="tab"`.
 */
export function KollabScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  backTone = 'card',
  size = 'stack',
  right,
  style,
}: Props) {
  const kollab = useKollab();
  const router = useRouter();
  const type = TITLE_SIZE[size];

  const backBg =
    backTone === 'frost'
      ? 'rgba(245,243,237,0.94)'
      : backTone === 'well'
        ? kollab.color.well
        : kollab.color.card;
  const backFg = backTone === 'frost' ? '#171410' : kollab.color.ink;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            style={[styles.back, { backgroundColor: backBg }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={[styles.backGlyph, { color: backFg }]}>←</Text>
          </Pressable>
        ) : null}
        <Text
          style={[
            styles.title,
            {
              color: kollab.color.ink,
              fontSize: type.fontSize,
              letterSpacing: type.letterSpacing,
              lineHeight: type.lineHeight,
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: kollab.color.ink, marginLeft: showBack ? 45 : 0 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backGlyph: {
    fontSize: 15,
    lineHeight: 18,
  },
  title: {
    flex: 1,
    fontFamily: font.display,
  },
  subtitle: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 13,
    opacity: 0.55,
    marginTop: 4,
  },
});
