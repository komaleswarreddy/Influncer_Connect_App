import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen, PrimaryButton, SectionHeader } from '@/components/ui';
import { useCatalogStore } from '@/store/catalog-store';
import { formatCatalogInr } from '@/lib/catalog-api';
import { premiumNavy, spacing, radius, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';

const IMAGE_SIZE = 80;

export default function CatalogPreviewScreen() {
  const shell = useAppShell();
  const router = useRouter();
  const { catalog, isLoading, fetchMyCatalog, submitForReview, isSaving } = useCatalogStore();

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog();
    }, [fetchMyCatalog])
  );

  const onSubmit = () => {
    Alert.alert(
      'Submit for review?',
      'Your catalog will be sent to our team for approval. You can edit again after reopening if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            void submitForReview().then((ok) => {
              if (ok) {
                router.replace('/account-screens/catalog' as never);
              } else {
                Alert.alert(
                  'Could not submit',
                  useCatalogStore.getState().error ?? 'Check all products have photos.'
                );
              }
            });
          },
        },
      ]
    );
  };

  if (isLoading && !catalog) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={shell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Preview" subtitle="How customers will see your catalog" />

      <View style={styles.hero}>
        <LinearGradient
          colors={[...premiumNavy.base.colors]}
          locations={[...premiumNavy.base.locations]}
          start={premiumNavy.base.start}
          end={premiumNavy.base.end}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.heroTitle}>{catalog?.storeName}</Text>
        <Text style={styles.heroType}>{catalog?.businessType?.replace(/_/g, ' ')}</Text>
        {catalog?.description ? <Text style={styles.heroDesc}>{catalog.description}</Text> : null}
      </View>

      {catalog?.categories.map((cat) => (
        <View key={cat.id} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>{cat.name}</Text>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: shell.card, borderColor: shell.cardBorder },
            ]}
          >
            {cat.products.map((p, index) => (
              <View
                key={p.id}
                style={[
                  styles.productRow,
                  index > 0
                    ? [styles.productRowBorder, { borderTopColor: shell.borderSubtle }]
                    : null,
                ]}
              >
                <View style={styles.productBody}>
                  <Text
                    style={[styles.productName, { color: shell.textPrimary }]}
                    numberOfLines={2}
                  >
                    {p.name}
                  </Text>
                  {p.description ? (
                    <Text
                      style={[styles.productDesc, { color: shell.textSecondary }]}
                      numberOfLines={2}
                    >
                      {p.description}
                    </Text>
                  ) : null}
                  <Text style={[styles.productPrice, { color: shell.textPrimary }]}>
                    {formatCatalogInr(p.price)}
                  </Text>
                </View>
                <View style={[styles.imageFrame, { backgroundColor: shell.canvasAlt }]}>
                  {p.imageUrl ? (
                    <Image
                      source={{ uri: p.imageUrl }}
                      style={styles.productImage}
                      resizeMode="cover"
                      accessibilityLabel={`${p.name} photo`}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      <PrimaryButton
        label="Submit for review"
        onPress={onSubmit}
        loading={isSaving}
        disabled={isSaving}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 112,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#fff',
    marginBottom: 4,
  },
  heroType: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  heroDesc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
  },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.2,

    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  menuCard: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,

    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: IMAGE_SIZE + 8,
  },
  productRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15, 23, 42, 0.08)',
  },
  productBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 4,
    paddingRight: 4,
  },
  productName: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  productDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
  },
  productPrice: {
    fontFamily: fonts.bold,
    fontSize: 15,

    marginTop: 2,
  },
  imageFrame: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
