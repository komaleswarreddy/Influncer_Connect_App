import React from 'react';
import { View, Text, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useKollab, font, radius as kollabRadius } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import { nicheCoverSource, nicheCoverCardShape } from '@/lib/niche-cover';
import type { OpportunityStatusTone } from '@/lib/opportunity-card-ui';

/** Local status-tone → Kollab status-chip tone map. Also covers the pre-existing 'open'
 *  fallback (previously an invalid `OPPORTUNITY_RAIL.open` lookup that doesn't type-check
 *  against `OpportunityStatusTone`) so callers that pass no statusTone still resolve cleanly. */
type StatusToneKey = OpportunityStatusTone | 'open';
const STATUS_CHIP_TONE: Record<StatusToneKey, keyof KollabTokens['statusChip']> = {
  pending: 'neutral',
  active: 'live',
  review: 'info',
  success: 'live',
  declined: 'neutral',
  warning: 'warn',
  neutral: 'neutral',
  open: 'neutral',
};

export type CampaignReferenceCardProps = {
  title: string;
  brandName: string;
  metaLine: string;
  statusLabel?: string | null;
  statusTone?: OpportunityStatusTone;
  commissionRate: string;
  duration: string;
  /** Real niche key (e.g. `campaign.requiredInfluencerNiche`) — selects the full-bleed cover
   *  photo + card aspect via `nicheCoverSource`/`nicheCoverCardShape`. Falls back to the
   *  'lifestyle' cover when omitted (e.g. UGC briefs, which carry no niche field). */
  niche?: string | null;
  brandLogoUrl?: string | null;
  shortDescription?: string | null;
  /** Label under the primary rate (default: commission). */
  rateLabel?: string;
  footerBadge?: string | null;
  footerButtonLabel: string;
  onFooterPress: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Stretch card to fill parent (swipe feed pages) so no dead white gap under metrics. */
  fillHeight?: boolean;
};

function truncateDescription(text: string, max = 110): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

/** True "TBD"/empty durations add nothing to the meta line — only surface real ranges. */
function meaningfulDuration(duration: string): string | null {
  const trimmed = (duration ?? '').trim();
  if (!trimmed || trimmed.toUpperCase() === 'TBD') return null;
  return trimmed;
}

export const CampaignReferenceCard = React.memo(function CampaignReferenceCard({
  title,
  brandName,
  metaLine,
  statusLabel,
  statusTone,
  commissionRate,
  duration,
  niche,
  brandLogoUrl,
  shortDescription,
  rateLabel = 'commission',
  footerBadge,
  footerButtonLabel,
  onFooterPress,
  onPress,
  style,
  fillHeight = false,
}: CampaignReferenceCardProps) {
  const kollab = useKollab();
  const chipTone = STATUS_CHIP_TONE[(statusTone as StatusToneKey | undefined) ?? 'open'];
  const statusBg = kollab.statusChip[chipTone].bg;
  const statusFg = kollab.statusChip[chipTone].fg;
  const showStatusPill = Boolean(statusLabel && String(statusLabel).trim());
  const desc =
    shortDescription && shortDescription.trim() ? truncateDescription(shortDescription) : null;

  const cover = nicheCoverSource(niche);
  const shape = kollab.cardShape[nicheCoverCardShape(niche)];

  // Duration is real, useful data that the mockup's card doesn't surface as its own tile —
  // fold it into the meta line (a permitted "secondary position") instead of dropping it.
  const durationText = meaningfulDuration(duration);
  const metaWithDuration = durationText ? `${metaLine} • ${durationText}` : metaLine;

  const brandInitial = (brandName || '?').trim().charAt(0).toUpperCase() || '?';

  const content = (
    <View
      style={[
        styles.shell,
        { backgroundColor: kollab.color.imgBg, borderRadius: kollabRadius.cardL },
        fillHeight ? styles.shellFill : { height: shape.listHeight },
        kollab.shadow.photoCard,
        style,
      ]}
    >
      <Image source={cover} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <LinearGradient
        colors={kollab.scrimStops.card.colors as [string, string, string]}
        locations={kollab.scrimStops.card.locations as [number, number, number]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.brandBadge}>
        {brandLogoUrl ? (
          <Image source={{ uri: brandLogoUrl }} style={styles.brandMarkImage} contentFit="cover" />
        ) : (
          <View style={[styles.brandMark, { backgroundColor: kollab.color.ink }]}>
            <Text style={styles.brandMarkText}>{brandInitial}</Text>
          </View>
        )}
        <Text style={styles.brandName} numberOfLines={1}>
          {brandName}
        </Text>
      </View>

      {showStatusPill ? (
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusFg }]} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
      ) : null}

      <View style={styles.bottom}>
        <Text style={styles.meta} numberOfLines={1}>
          {metaWithDuration}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.payRow}>
          <View style={styles.payLeftGroup}>
            {footerBadge ? (
              <View style={styles.footerBadgeChip}>
                <Text style={styles.footerBadgeChipText} numberOfLines={1}>
                  {footerBadge}
                </Text>
              </View>
            ) : null}
            <View style={[styles.payPill, { backgroundColor: kollab.color.chartreuse }]}>
              <Text
                style={[styles.payText, { color: kollab.color.onChartreuse }]}
                numberOfLines={1}
              >
                {commissionRate} {rateLabel}
              </Text>
            </View>
          </View>

          {/* Second, distinct tap target: branches by status (Open contract / Track progress /
              View & Apply) independently of the card body's onPress. Restyled as the mockup's
              compact circular arrow-well, with the branching label kept as a small caption so
              it doesn't get lost. */}
          <Pressable
            onPress={onFooterPress}
            accessibilityRole="button"
            accessibilityLabel={footerButtonLabel}
            hitSlop={8}
            style={styles.footerAction}
          >
            <Text style={styles.footerActionLabel} numberOfLines={1}>
              {footerButtonLabel}
            </Text>
            <View style={styles.arrowWell}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Pressable>
        </View>

        {desc ? (
          <Text style={styles.description} numberOfLines={2}>
            {desc}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={fillHeight ? styles.pressableFill : undefined}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  shellFill: {
    flex: 1,
  },
  pressableFill: {
    flex: 1,
    width: '100%',
  },
  // Brand badge — floating top-left pill over the cover image. Offsets/sizes/colors ported
  // verbatim from components/ui/PhotoCard.tsx (brandBadge/brandMark/brandName).
  brandBadge: {
    position: 'absolute',
    top: 13,
    left: 13,
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
  brandMarkImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  brandMarkText: {
    fontFamily: font.bold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  brandName: {
    fontFamily: font.bold,
    fontSize: 11.5,
    color: '#171410',
    maxWidth: 150,
  },
  // Status badge — floating top-right pill, solid tone bg + fg (not translucent-white + dot).
  statusBadge: {
    position: 'absolute',
    top: 13,
    right: 13,
    maxWidth: '46%',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: font.bold,
    fontSize: 11,
  },
  // Bottom-of-image overlay block — meta, title, pay/action row, optional description.
  bottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 15,
  },
  meta: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  title: {
    fontFamily: font.display,
    fontSize: 25,
    lineHeight: 28,
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 9,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  payLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  payPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexShrink: 1,
  },
  payText: {
    fontFamily: font.bold,
    fontSize: 12.5,
  },
  footerBadgeChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    flexShrink: 0,
  },
  footerBadgeChipText: {
    fontFamily: font.bold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  footerActionLabel: {
    fontFamily: font.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    maxWidth: 96,
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
  description: {
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 8,
  },
});

export default CampaignReferenceCard;
