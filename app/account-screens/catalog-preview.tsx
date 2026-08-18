import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ScrollScreen,
  KollabButton,
  KollabScreenHeader,
  showKollabToast,
  showKollabConfirm,
} from '@/components/ui';
import { CatalogItemTile } from '@/components/catalog/CatalogItemTile';
import { useCatalogStore } from '@/store/catalog-store';
import {
  catalogImageSource,
  catalogProductCount,
  flattenCatalogProducts,
  productImageUrl,
  type CatalogKind,
} from '@/lib/catalog-api';
import { formatInr } from '@/lib/currency';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import { useAuthStore } from '@/store/auth-store';

export default function CatalogPreviewScreen() {
  const kollab = useKollab();
  const styles = useStyles(kollab);
  const router = useRouter();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const kind: CatalogKind = kindParam === 'services' ? 'services' : 'products';
  const handle = (useAuthStore.getState().user?.username || '').replace(/^@+/, '');
  const {
    catalogs,
    isLoading: isLoadingByKind,
    fetchMyCatalog,
    submitForReview,
    isSaving: isSavingByKind,
  } = useCatalogStore();
  const catalog = catalogs[kind];
  const isLoading = isLoadingByKind[kind];
  const isSaving = isSavingByKind[kind];
  const isServiceCatalog = catalog?.businessType === 'services';
  const products = flattenCatalogProducts(catalog);
  const count = catalogProductCount(catalog);

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog(kind);
    }, [fetchMyCatalog, kind])
  );

  const onSubmit = () => {
    void showKollabConfirm({
      title: 'Submit for review?',
      message: `Your ${isServiceCatalog ? 'service catalog' : 'product catalog'} will be sent to our team for approval.`,
      confirmLabel: 'Submit',
    }).then((ok) => {
      if (!ok) return;
      void submitForReview(kind).then((submitted) => {
        if (submitted) {
          router.replace('/account-screens/catalog' as never);
        } else {
          showKollabToast(
            useCatalogStore.getState().error[kind] ??
              `Check all ${isServiceCatalog ? 'services' : 'products'} have photos.`
          );
        }
      });
    });
  };

  if (isLoading && !catalog) {
    return (
      <ScrollScreen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 80 }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <KollabScreenHeader title="Preview" />
      </View>

      <View style={styles.body}>
        <Text style={[styles.store, { color: kollab.color.ink }]}>
          {catalog?.storeName || 'Your storefront'}
        </Text>
        <Text style={[styles.handle, { color: kollab.color.violet }]}>
          {handle ? `@${handle}` : 'Storefront'} · {count}{' '}
          {isServiceCatalog
            ? count === 1
              ? 'service'
              : 'services'
            : count === 1
              ? 'product'
              : 'products'}
        </Text>

        <View style={styles.grid}>
          {products.map((p) => (
            <View key={p.id} style={styles.gridCell}>
              <CatalogItemTile
                cover={catalogImageSource(productImageUrl(p))}
                name={p.name}
                meta={p.description || (isServiceCatalog ? 'Service' : 'Product')}
                priceLabel={formatInr(p.price)}
                onPress={() =>
                  router.push({
                    pathname: '/account-screens/catalog-builder',
                    params: { kind },
                  } as never)
                }
              />
            </View>
          ))}
        </View>

        <KollabButton
          label={isSaving ? 'Submitting…' : 'Submit for review'}
          onPress={onSubmit}
          disabled={isSaving || products.length === 0}
        />
      </View>
    </ScrollScreen>
  );
}

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        head: {
          paddingHorizontal: space.gutter,
          paddingTop: 4,
        },
        body: {
          paddingHorizontal: space.gutter,
          paddingBottom: 24,
        },
        store: {
          fontFamily: font.display,
          fontSize: 30,
          letterSpacing: -0.6,
          lineHeight: 34,
        },
        handle: {
          fontFamily: font.semiBold,
          fontSize: 13,
          marginTop: 2,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 18,
          marginBottom: 16,
        },
        gridCell: { width: '47.5%' },
      }),
    [kollab]
  );
}
