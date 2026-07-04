import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScrollScreen, SectionHeader, PremiumCard, PrimaryButton, SecondaryButton, ListRow } from '@/components/ui';
import { affiliateApi, trackingClickUrl, type TrackingLink, type EligibleProduct } from '@/lib/affiliate-api';
import { appShell, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

export default function AffiliateLinksScreen() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [eligible, setEligible] = useState<EligibleProduct[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, e] = await Promise.all([affiliateApi.listLinks(), affiliateApi.eligibleProducts()]);
      setLinks(l);
      setEligible(e.filter((p) => !p.hasTrackingLink));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Affiliate links unavailable');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const copyLink = async (code: string) => {
    const url = trackingClickUrl(code);
    await Share.share({ message: url });
  };

  const createFor = async (productId: string) => {
    try {
      await affiliateApi.createLink(productId);
      await load();
    } catch (e) {
      Alert.alert('Create failed', e instanceof Error ? e.message : 'Try again');
    }
  };

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Affiliate links" subtitle="Tracking links for your catalog products" />
      {error ? (
        <PremiumCard>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.muted}>Affiliate access may require an approved affiliate role.</Text>
        </PremiumCard>
      ) : null}

      <PremiumCard title="Your links">
        {links.length === 0 ? (
          <Text style={styles.muted}>No tracking links yet.</Text>
        ) : (
          links.map((link) => (
            <ListRow
              key={link.id}
              title={link.product?.name || link.trackingCode}
              subtitle={`${link.totalClicks} clicks · ${link.totalConversions} conversions`}
              onPress={() => void copyLink(link.trackingCode)}
              showChevron
            />
          ))
        )}
      </PremiumCard>

      <PremiumCard title="Create link" style={{ marginTop: spacing.sm }}>
        {eligible.length === 0 ? (
          <Text style={styles.muted}>No eligible products without a link.</Text>
        ) : (
          eligible.slice(0, 8).map((p) => (
            <View key={p.id} style={{ marginBottom: spacing.xs }}>
              <SecondaryButton label={`Link: ${p.name}`} onPress={() => void createFor(p.id)} />
            </View>
          ))
        )}
        <PrimaryButton label="Refresh" onPress={() => void load()} />
      </PremiumCard>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  muted: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textSecondary },
  error: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.error, marginBottom: spacing.xs },
});
