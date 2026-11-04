import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabSelect,
  KollabButton,
  showKollabToast,
  showKollabConfirm,
} from '@/components/ui';
import { CatalogProductSheet } from '@/components/catalog/CatalogProductSheet';
import { CatalogItemTile } from '@/components/catalog/CatalogItemTile';
import { useCatalogStore } from '@/store/catalog-store';
import {
  catalogImageSource,
  catalogProductCount,
  productImageUrl,
  type CatalogProduct,
  type CatalogKind,
} from '@/lib/catalog-api';
import { getRecommendedCategories } from '@/lib/catalog-recommendations';
import { formatInr } from '@/lib/currency';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

function visitLabel(visit?: CatalogProduct['visitType']): string | null {
  if (!visit) return null;
  if (visit === 'salon') return 'At salon';
  if (visit === 'center') return 'Center';
  if (visit === 'online') return 'Online';
  if (visit === 'virtual') return 'Virtual';
  return 'Home';
}

export default function CatalogBuilderScreen() {
  const kollab = useKollab();
  const styles = useStyles(kollab);
  const router = useRouter();
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const kind: CatalogKind = kindParam === 'services' ? 'services' : 'products';
  const {
    catalogs,
    isLoading: isLoadingByKind,
    fetchMyCatalog,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    isSaving: isSavingByKind,
  } = useCatalogStore();
  const catalog = catalogs[kind];
  const isLoading = isLoadingByKind[kind];
  const isSaving = isSavingByKind[kind];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [otherCategoryName, setOtherCategoryName] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog(kind);
    }, [fetchMyCatalog, kind])
  );

  const productCount = catalogProductCount(catalog);
  const isServiceCatalog = catalog?.businessType === 'services';
  const itemLabel = isServiceCatalog ? 'service' : 'product';
  const itemLabelPlural = isServiceCatalog ? 'services' : 'products';
  const existingNames = useMemo(
    () =>
      new Set((catalog?.categories ?? []).map((c) => c.name.trim().toLowerCase()).filter(Boolean)),
    [catalog?.categories]
  );
  const categoryOptions = useMemo(() => {
    const recommended = getRecommendedCategories(catalog?.businessType);
    return recommended.map((label) => {
      const taken = label !== 'Other' && existingNames.has(label.toLowerCase());
      return { value: label, label, disabled: taken };
    });
  }, [catalog?.businessType, existingNames]);
  const otherSelected = selectedCategory === 'Other';

  const onAddCategory = async () => {
    const name = (otherSelected ? otherCategoryName : (selectedCategory ?? '')).trim();
    if (!selectedCategory) {
      showKollabToast('Select a category.');
      return;
    }
    if (!name) {
      showKollabToast('Enter a category name.');
      return;
    }
    if (existingNames.has(name.toLowerCase())) {
      showKollabToast('That category is already in this catalog.');
      return;
    }
    try {
      await addCategory(kind, name);
      setSelectedCategory(null);
      setOtherCategoryName('');
      showKollabToast('Category added');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Failed');
    }
  };

  const openAddProduct = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setEditingProduct(null);
    setSheetVisible(true);
  };

  const openEditProduct = (categoryId: string, product: CatalogProduct) => {
    setActiveCategoryId(categoryId);
    setEditingProduct(product);
    setSheetVisible(true);
  };

  const activeCategory = catalog?.categories.find((c) => c.id === activeCategoryId);

  if (isLoading && !catalog) {
    return (
      <ScrollScreen padH={space.gutter}>
        <KollabScreenHeader title="Build your catalog" subtitle="Add the items followers can buy" />
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 40 }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen padH={0} safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headPad}>
        <KollabScreenHeader title="Build your catalog" subtitle="Add the items followers can buy" />
      </View>

      <View style={styles.body}>
        <Text style={[styles.label, { color: kollab.color.ink }]}>
          Category <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View style={styles.catRow}>
          <View style={styles.catInput}>
            <KollabSelect
              value={selectedCategory}
              placeholder="Select category"
              options={categoryOptions}
              onChange={setSelectedCategory}
              accessibilityLabel="Select category"
            />
          </View>
          <KollabButton
            label="Add"
            variant="ink"
            compact
            disabled={
              isSaving ||
              !selectedCategory ||
              (otherSelected && otherCategoryName.trim().length === 0)
            }
            onPress={() => void onAddCategory()}
            style={styles.addBtn}
          />
        </View>
        {otherSelected ? (
          <View style={styles.otherField}>
            <KollabTextField
              placeholder="Enter category name"
              value={otherCategoryName}
              onChangeText={setOtherCategoryName}
            />
          </View>
        ) : null}

        <Text style={[styles.label, { color: kollab.color.ink }]}>Items</Text>
        {(catalog?.categories ?? []).map((cat) => (
          <View key={cat.id} style={styles.catBlock}>
            <View style={styles.catHead}>
              <Text style={[styles.catName, { color: kollab.color.ink }]}>{cat.name}</Text>
              <Pressable
                onPress={() => {
                  void showKollabConfirm({
                    title: 'Delete category?',
                    message: `Remove "${cat.name}" and all its ${itemLabelPlural}?`,
                    confirmLabel: 'Delete',
                    destructive: true,
                  }).then((ok) => {
                    if (ok) void deleteCategory(kind, cat.id);
                  });
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.deleteText, { color: kollab.color.heat }]}>Delete</Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              {cat.products.map((p) => {
                const metaBits = [
                  cat.name,
                  isServiceCatalog && p.durationMinutes ? `${p.durationMinutes} min` : null,
                  visitLabel(p.visitType),
                ].filter(Boolean);
                return (
                  <View key={p.id} style={styles.gridCell}>
                    <CatalogItemTile
                      cover={catalogImageSource(productImageUrl(p))}
                      name={p.name}
                      meta={metaBits.join(' · ') || itemLabel}
                      priceLabel={formatInr(p.price)}
                      onPress={() => openEditProduct(cat.id, p)}
                    />
                    <Pressable
                      onPress={() => {
                        void showKollabConfirm({
                          title: `Delete ${itemLabel}?`,
                          message: p.name,
                          confirmLabel: 'Delete',
                          destructive: true,
                        }).then((ok) => {
                          if (ok) void deleteProduct(kind, p.id);
                        });
                      }}
                      style={styles.deleteItem}
                    >
                      <Text style={[styles.deleteText, { color: kollab.color.heat }]}>Remove</Text>
                    </Pressable>
                  </View>
                );
              })}
              <Pressable
                onPress={() => openAddProduct(cat.id)}
                style={[
                  styles.addTile,
                  { backgroundColor: kollab.color.cardSoft, borderColor: kollab.color.outline },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${itemLabel}`}
              >
                <Text style={[styles.addTileText, { color: kollab.color.ink }]}>
                  + Add {itemLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        {catalog?.categories.length === 0 ? (
          <Text style={[styles.empty, { color: kollab.color.ink }]}>
            Add a category, then add {itemLabelPlural} followers can buy.
          </Text>
        ) : null}

        <KollabButton
          label="Preview storefront"
          variant="ink"
          disabled={productCount === 0}
          onPress={() =>
            router.push({
              pathname: '/account-screens/catalog-preview',
              params: { kind },
            } as never)
          }
          style={styles.previewBtn}
        />
      </View>

      <CatalogProductSheet
        visible={sheetVisible}
        categoryName={activeCategory?.name ?? 'Category'}
        product={editingProduct}
        itemLabel={itemLabel}
        onClose={() => setSheetVisible(false)}
        onUploadImage={uploadProductImage}
        onSave={async (data) => {
          if (editingProduct) {
            await updateProduct(kind, editingProduct.id, data);
          } else if (activeCategoryId) {
            await addProduct(kind, activeCategoryId, data);
          }
        }}
      />
    </ScrollScreen>
  );
}

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        headPad: { paddingHorizontal: space.gutter, paddingTop: 2 },
        body: { paddingHorizontal: space.gutter, paddingBottom: 24 },
        label: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
          opacity: 0.62,
          marginBottom: 7,
        },
        catRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          marginBottom: 18,
        },
        catInput: { flex: 1, minWidth: 0 },
        addBtn: { paddingHorizontal: 18 },
        otherField: { marginTop: -8, marginBottom: 18 },
        catBlock: { marginBottom: 16 },
        catHead: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        catName: {
          fontFamily: font.semiBold,
          fontSize: 13.5,
        },
        deleteText: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        },
        gridCell: { width: '47.5%' },
        addTile: {
          width: '47.5%',
          minHeight: 184,
          borderRadius: 20,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        },
        addTileText: {
          fontFamily: font.semiBold,
          fontSize: 13.5,
        },
        deleteItem: { paddingTop: 6, alignSelf: 'flex-start' },
        empty: {
          fontFamily: font.body,
          fontSize: 13,
          opacity: 0.55,
          marginBottom: 16,
          lineHeight: 19,
        },
        previewBtn: { marginTop: 8 },
      }),
    [kollab]
  );
}
