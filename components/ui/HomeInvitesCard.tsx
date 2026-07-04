import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  type StyleProp,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell, spacing, radius, shadow } from '@/theme';
import { fonts } from './typography';
import {
  HOME_DESIGN,
  HOME_INVITES_MIN_HEIGHT,
  HOME_INVITES_TEXT_MAX_RATIO,
  invitesCardHeight,
  scaleX,
} from '@/lib/home-mock-layout';

const INVITE_ART = require('@/assets/invite.png');

type Props = {
  unreadCount: number;
  onOpenInbox: () => void;
  style?: StyleProp<ViewStyle>;
};

export function HomeInvitesCard({ unreadCount, onOpenInbox, style }: Props) {
  const [cardWidth, setCardWidth] = useState(HOME_DESIGN.cardWidth);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setCardWidth(w);
  }, []);

  const aspectHeight = invitesCardHeight(cardWidth);
  const cardHeight = Math.max(aspectHeight, scaleX(cardWidth, HOME_INVITES_MIN_HEIGHT));
  const unreadLabel =
    unreadCount > 0 ? `${unreadCount} unread updates` : '0 unread updates';

  return (
    <View style={[styles.cardWrap, style]} onLayout={onLayout}>
      <ImageBackground
        source={INVITE_ART}
        style={[styles.card, shadow.card, { height: cardHeight }]}
        imageStyle={styles.cardImage}
        resizeMode="cover"
      >
        <View style={[styles.contentCol, { width: cardWidth * HOME_INVITES_TEXT_MAX_RATIO }]}>
          <Text style={styles.title}>
            Invites & notifications
          </Text>
          <Text style={styles.subtitle}>
            {unreadLabel}
          </Text>

          <TouchableOpacity
            style={styles.ctaPill}
            onPress={onOpenInbox}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open invite inbox"
          >
            <Text style={styles.ctaText}>Open invite inbox</Text>
            <Ionicons name="chevron-forward" size={12} color="#FFFFFF" style={styles.ctaChevron} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    justifyContent: 'center',
  },
  cardImage: {
    borderRadius: radius.xl,
  },
  contentCol: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    lineHeight: 22,
    color: appShell.textPrimary,
    marginBottom: 4,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: appShell.cta,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingLeft: 14,
    paddingRight: 10,
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  ctaChevron: {
    marginLeft: 2,
  },
});
