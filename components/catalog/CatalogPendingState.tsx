import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

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
  return (
    <View style={styles.wrap}>
      <View style={styles.iconTile}>
        <Ionicons name="hourglass-outline" size={36} color="#92400E" />
      </View>
      <Text style={styles.title}>Request submitted</Text>
      <Text style={styles.body}>
        An administrator will review your storefront. When it is approved, sign out and sign back in
        to load your store workspace, or open the dashboard again.
      </Text>
      <Text style={styles.meta}>
        Usually takes 24–48 hours · {categoryCount} categories · {productCount} {itemLabelPlural}
      </Text>
      <View style={styles.actions}>
        {onRefresh ? (
          <PrimaryButton
            label="Refresh status"
            onPress={onRefresh}
            loading={refreshing}
            disabled={refreshing}
          />
        ) : null}
        {onEditCatalog ? <SecondaryButton label="Edit storefront" onPress={onEditCatalog} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    minHeight: 420,
  },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: appShell.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: appShell.textSecondary,
    textAlign: 'center',
    maxWidth: 340,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.sm,
  },
});
