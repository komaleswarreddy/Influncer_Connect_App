import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useKollab, font, uniformCard, type as kType } from '@/theme/kollab-tokens';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';
import { nicheCoverSource } from '@/lib/niche-cover';
import type { Campaign } from '@/store/campaign-store';

type Props = {
  campaigns: Campaign[];
  onOpenCampaign: (campaignId: string) => void;
  style?: StyleProp<ViewStyle>;
};

const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function formatDurationRange(startDate?: string, endDate?: string): string {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const startValid = !!start && !Number.isNaN(start.getTime());
  const endValid = !!end && !Number.isNaN(end.getTime());
  if (startValid && endValid)
    return `${SHORT_MONTH_DAY.format(start)} – ${SHORT_MONTH_DAY.format(end)}`;
  if (startValid) return `Starts ${SHORT_MONTH_DAY.format(start)}`;
  return 'TBD';
}

export function HomeFreshCollabsRail({ campaigns, onOpenCampaign, style }: Props) {
  const kollab = useKollab();
  if (campaigns.length === 0) return null;

  return (
    <View style={style}>
      <Text style={[styles.heading, { color: kollab.color.ink }]}>Fresh collabs</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {campaigns.map((campaign) => {
          const cid = String(campaign.id);
          const pay = resolveCampaignPaySummary(campaign);
          const niche = campaign.requiredInfluencerNiche;
          const brand = String(campaign.tenant?.tenantName || 'Brand');
          const short = String(campaign.name || 'Untitled')
            .split(' ')
            .slice(0, 3)
            .join(' ');
          return (
            <Pressable
              key={cid}
              onPress={() => onOpenCampaign(cid)}
              style={[
                styles.card,
                {
                  width: uniformCard.railWidth,
                  height: uniformCard.railHeight,
                  borderRadius: uniformCard.borderRadius,
                  backgroundColor: kollab.color.imgBg,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={short}
            >
              <Image
                source={nicheCoverSource(niche)}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
              <LinearGradient
                colors={kollab.scrimStops.rail.colors as [string, string]}
                locations={kollab.scrimStops.rail.locations as [number, number]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.commChip}>
                <Text style={styles.commText}>{pay.pillLabel || pay.primaryLabel} comm.</Text>
              </View>
              <View style={styles.bottom}>
                <Text style={styles.brand} numberOfLines={1}>
                  {brand}
                </Text>
                <Text style={styles.title} numberOfLines={2}>
                  {short}
                </Text>
                <View style={styles.payRow}>
                  <View style={[styles.datePill, { backgroundColor: kollab.color.chartreuse }]}>
                    <Text style={[styles.dateText, { color: kollab.color.onChartreuse }]}>
                      {formatDurationRange(campaign.startDate, campaign.endDate ?? undefined)}
                    </Text>
                  </View>
                  <View style={styles.arrow}>
                    <Text style={styles.arrowGlyph}>→</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...kType.sectionTitle,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  commChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(245,243,237,0.92)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  commText: {
    fontFamily: font.bold,
    fontSize: 10.5,
    color: '#171410',
  },
  bottom: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  brand: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 15,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  title: {
    fontFamily: font.display,
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 10,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePill: {
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  dateText: {
    fontFamily: font.bold,
    fontSize: 11,
  },
  arrow: {
    width: 26,
    height: 26,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: {
    fontSize: 12,
    color: '#171410',
  },
});
