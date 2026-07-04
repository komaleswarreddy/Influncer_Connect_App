import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import type { PostAnalysis } from '@/lib/post-analyzer-api';
import { formatCompactNumber } from '@/lib/my-stats-dashboard-stats';
import {
  getPlatformColor,
  getPlatformLabel,
  type SupportedPlatform,
} from '@/lib/post-url-parser';
import { AuthenticityGradeBadge } from '@/components/ui/AuthenticityGradeBadge';

type Props = {
  item: PostAnalysis;
};

function platformIconName(platform: string): keyof typeof Ionicons.glyphMap {
  switch (platform) {
    case 'youtube':
      return 'logo-youtube';
    case 'instagram':
      return 'logo-instagram';
    case 'tiktok':
      return 'logo-tiktok';
    case 'twitter':
      return 'logo-twitter';
    default:
      return 'globe-outline';
  }
}

export function MyStatsPostCard({ item }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const platform = item.platform as SupportedPlatform;
  const platformColor = getPlatformColor(platform);
  const displayName = item.creatorFullName || item.creatorUsername;
  const views =
    typeof item.views === 'number' ? formatCompactNumber(item.views) : '—';

  const openPost = () => {
    setMenuOpen(false);
    if (item.url) void Linking.openURL(item.url);
  };

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.headerRow}>
        <View style={styles.profileRow}>
          {item.creatorProfilePic ? (
            <Image source={{ uri: item.creatorProfilePic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: platformColor }]}>
              <Ionicons name={platformIconName(platform)} size={18} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.profileCopy}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.handle} numberOfLines={1}>
              @{item.creatorUsername}
            </Text>
            <Text style={styles.followers}>
              {formatCompactNumber(item.creatorFollowers)} followers
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <AuthenticityGradeBadge
            score={item.authenticityScore ?? null}
            grade={item.authenticityGrade ?? null}
            size="medium"
          />
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <Ionicons name="ellipsis-vertical" size={18} color={appShell.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricsBar}>
        <MetricCell icon="thumbs-up-outline" value={formatCompactNumber(item.likes)} label="Likes" />
        <MetricCell
          icon="chatbubble-outline"
          value={formatCompactNumber(item.comments)}
          label="Comments"
        />
        <MetricCell icon="eye-outline" value={views} label="Views" />
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={openPost}>
              <Ionicons name="open-outline" size={18} color={appShell.textPrimary} />
              <Text style={styles.menuItemText}>Open post</Text>
            </TouchableOpacity>
            <Text style={styles.menuMeta}>{getPlatformLabel(platform)}</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MetricCell({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metricCell}>
      <Ionicons name={icon} size={14} color={appShell.textSecondary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appShell.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  profileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: appShell.textPrimary,
    letterSpacing: -0.2,
  },
  handle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appShell.textSecondary,
    marginTop: 1,
  },
  followers: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appShell.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuBtn: {
    padding: 4,
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: appShell.textPrimary,
  },
  metricLabel: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: appShell.textSecondary,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: appShell.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: appShell.textPrimary,
  },
  menuMeta: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: appShell.textSecondary,
  },
});
