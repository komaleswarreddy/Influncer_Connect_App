import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Share, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
} from '@/components/ui';
import {
  affiliateApi,
  trackingClickUrl,
  type TrackingLink,
  type EligibleProduct,
} from '@/lib/affiliate-api';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

export default function AffiliateLinksScreen() {
  const kollab = useKollab();
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [eligible, setEligible] = useState<EligibleProduct[]>([]);
  const [productName, setProductName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [l, e] = await Promise.all([affiliateApi.listLinks(), affiliateApi.eligibleProducts()]);
      setLinks(l);
      setEligible(e.filter((p) => !p.hasTrackingLink));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Affiliate links unavailable');
      setLinks([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const copyLink = async (code: string) => {
    const url = trackingClickUrl(code);
    await Share.share({ message: url });
  };

  const createFor = async (productId: string) => {
    try {
      await affiliateApi.createLink(productId);
      await load();
      showKollabToast('Affiliate link created');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Try again');
    }
  };

  const createFromName = async () => {
    const match = eligible.find((p) =>
      p.name.toLowerCase().includes(productName.trim().toLowerCase())
    );
    if (!match) {
      showKollabToast('Pick a product from your eligible catalog.');
      return;
    }
    await createFor(match.id);
    setProductName('');
  };

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader
        title="Affiliate links"
        subtitle="Tracking links for your catalog products"
      />

      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Active links</Text>
      <View style={styles.list}>
        {links.length === 0 ? (
          <Text style={[styles.muted, { color: kollab.color.ink }]}>No tracking links yet.</Text>
        ) : (
          links.map((link) => (
            <View
              key={link.id}
              style={[styles.row, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
            >
              <View style={styles.copy}>
                <Text style={[styles.product, { color: kollab.color.ink }]} numberOfLines={1}>
                  {link.product?.name || link.trackingCode}
                </Text>
                <Text style={[styles.url, { color: kollab.color.ink }]} numberOfLines={1}>
                  {trackingClickUrl(link.trackingCode)}
                </Text>
              </View>
              <View style={styles.clicks}>
                <Text style={[styles.clickN, { color: kollab.color.ink }]}>{link.totalClicks}</Text>
                <Text style={[styles.clickL, { color: kollab.color.ink }]}>clicks</Text>
              </View>
              <Pressable
                onPress={() => void copyLink(link.trackingCode)}
                style={[styles.copyBtn, { backgroundColor: kollab.color.tint }]}
              >
                <Text style={[styles.copyText, { color: kollab.color.violetDeep }]}>Copy</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={[styles.createCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        <Text style={[styles.createTitle, { color: kollab.color.ink }]}>Create link</Text>
        <KollabTextField
          surface="well"
          placeholder="Product name"
          value={productName}
          onChangeText={setProductName}
          style={styles.createInput}
        />
        {eligible.slice(0, 6).map((p) => (
          <Pressable key={p.id} onPress={() => setProductName(p.name)}>
            <Text style={[styles.eligible, { color: kollab.color.violetDeep }]}>{p.name}</Text>
          </Pressable>
        ))}
        <KollabButton
          label="Create link"
          variant="ink"
          compact
          onPress={() => void createFromName()}
        />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  list: { gap: 9, marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 17,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  copy: { flex: 1, minWidth: 0 },
  product: { fontFamily: font.semiBold, fontSize: 13.5 },
  url: { fontFamily: font.body, fontSize: 11.5, opacity: 0.55, marginTop: 2 },
  clicks: { alignItems: 'flex-end', flexShrink: 0 },
  clickN: { fontFamily: font.bold, fontSize: 14 },
  clickL: { fontFamily: font.body, fontSize: 10.5, opacity: 0.5 },
  copyBtn: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  copyText: { fontFamily: font.bold, fontSize: 11.5 },
  createCard: { borderRadius: 22, padding: 18 },
  createTitle: { ...kType.rowTitle, marginBottom: 12 },
  createInput: { marginBottom: 10 },
  eligible: { fontFamily: font.semiBold, fontSize: 12.5, marginBottom: 6 },
  muted: { fontFamily: font.body, fontSize: 13, opacity: 0.55 },
  error: { fontFamily: font.semiBold, fontSize: 14, marginBottom: 12 },
});
