import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KollabButton } from '@/components/ui';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

type Props = {
  categoryCount?: number;
  productCount?: number;
  itemLabelPlural?: string;
  onRefresh?: () => void;
  onEditCatalog?: () => void;
  refreshing?: boolean;
};

export function CatalogPendingState({
  categoryCount = 0,
  productCount = 0,
  itemLabelPlural = 'products',
  onRefresh,
  onEditCatalog,
  refreshing = false,
}: Props) {
  const kollab = useKollab();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconTile, { backgroundColor: kollab.color.chartreuse }]}>
        <Text style={[styles.iconGlyph, { color: kollab.color.onChartreuse }]}>●</Text>
      </View>
      <Text style={[styles.title, { color: kollab.color.ink }]}>Request submitted</Text>
      <Text style={[styles.body, { color: kollab.color.ink }]}>
        An administrator will review your storefront. When it is approved, sign out and sign back in
        to load your store workspace, or open the dashboard again.
      </Text>
      <Text style={[styles.meta, { color: kollab.color.ink }]}>
        Usually takes 24–48 hours · {categoryCount} categories · {productCount} {itemLabelPlural}
      </Text>
      <View style={styles.actions}>
        {onRefresh ? (
          <KollabButton
            label={refreshing ? 'Refreshing…' : 'Refresh status'}
            onPress={onRefresh}
            disabled={refreshing}
          />
        ) : null}
        {onEditCatalog ? (
          <KollabButton label="Edit storefront" variant="soft" onPress={onEditCatalog} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
    minHeight: 420,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconGlyph: {
    fontSize: 18,
  },
  title: {
    ...kType.sectionTitle,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    opacity: 0.62,
    maxWidth: 340,
  },
  meta: {
    fontFamily: font.body,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 12,
    marginBottom: 20,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 9,
  },
});
