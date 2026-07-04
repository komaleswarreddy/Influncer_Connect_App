import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen, PrimaryButton, SectionHeader } from '@/components/ui';
import { useCatalogStore } from '@/store/catalog-store';
import { formatCatalogInr } from '@/lib/catalog-api';
import { appShell, premiumNavy, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

export default function CatalogPreviewScreen() {
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
                Alert.alert('Could not submit', useCatalogStore.getState().error ?? 'Check all products have photos.');
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
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
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
          <Text style={styles.sectionTitle}>{cat.name}</Text>
          {cat.products.map((p) => (
            <View key={p.id} style={styles.productCard}>
              <View style={styles.imageFrame}>
                {p.imageUrl ? (
                  <Image
                    source={{ uri: p.imageUrl }}
                    style={styles.productImage}
                    resizeMode="contain"
                    accessibilityLabel={`${p.name} photo`}
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>
              <View style={styles.productBody}>
                <Text style={styles.productName}>{p.name}</Text>
                {p.description ? (
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
                <Text style={styles.productPrice}>{formatCatalogInr(p.price)}</Text>
              </View>
            </View>
          ))}
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
    marginBottom: spacing.lg,
    minHeight: 120,
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
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: appShell.textPrimary,
    marginBottom: spacing.sm,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: appShell.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    minHeight: 120,
  },
  imageFrame: {
    width: 120,
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: appShell.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.sm,
  },
  productBody: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  productName: { fontFamily: fonts.bold, fontSize: 16, color: appShell.textPrimary },
  productDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    marginTop: 4,
  },
  productPrice: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: appShell.textPrimary,
    marginTop: spacing.sm,
  },
});
