import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen, PrimaryButton, PremiumCard, SectionHeader } from '@/components/ui';
import { CatalogProductSheet } from '@/components/catalog/CatalogProductSheet';
import { useCatalogStore } from '@/store/catalog-store';
import { catalogProductCount, formatCatalogInr, type CatalogProduct } from '@/lib/catalog-api';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

export default function CatalogBuilderScreen() {
  const router = useRouter();
  const {
    catalog,
    isLoading,
    fetchMyCatalog,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    isSaving,
  } = useCatalogStore();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog();
    }, [fetchMyCatalog])
  );

  const productCount = catalogProductCount(catalog);

  const onAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Name required', 'Enter a category name.');
      return;
    }
    try {
      await addCategory(name);
      setNewCategoryName('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
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
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']} scrollProps={{ contentContainerStyle: { paddingBottom: 100 } }}>
      <SectionHeader
        title={catalog?.storeName ?? 'Build catalog'}
        subtitle={`${productCount} product${productCount === 1 ? '' : 's'} in catalog`}
      />

      <View style={styles.addCategoryRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholder="New category name"
          placeholderTextColor={appShell.textMuted}
        />
        <TouchableOpacity style={styles.addCatBtn} onPress={() => void onAddCategory()} disabled={isSaving}>
          <Text style={styles.addCatText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {catalog?.categories.map((cat) => (
        <PremiumCard key={cat.id} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{cat.name}</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete category?', `Remove "${cat.name}" and all its products?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => void deleteCategory(cat.id),
                  },
                ]);
              }}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
          {cat.products.map((p) => (
            <View key={p.id} style={styles.productRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productPrice}>{formatCatalogInr(p.price)}</Text>
              </View>
              <TouchableOpacity onPress={() => openEditProduct(cat.id, p)}>
                <Text style={styles.link}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Delete product?', p.name, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => void deleteProduct(p.id),
                    },
                  ]);
                }}
              >
                <Text style={[styles.link, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addProductBtn} onPress={() => openAddProduct(cat.id)}>
            <Text style={styles.addProductText}>+ Add product</Text>
          </TouchableOpacity>
        </PremiumCard>
      ))}

      {productCount > 0 ? (
        <View style={styles.stickyActions}>
          <PrimaryButton
            label="Preview catalog"
            onPress={() => router.push('/account-screens/catalog-preview' as never)}
          />
        </View>
      ) : null}

      <CatalogProductSheet
        visible={sheetVisible}
        categoryName={activeCategory?.name ?? 'Category'}
        product={editingProduct}
        onClose={() => setSheetVisible(false)}
        onUploadImage={uploadProductImage}
        onSave={async (data) => {
          if (editingProduct) {
            await updateProduct(editingProduct.id, data);
          } else if (activeCategoryId) {
            await addProduct(activeCategoryId, data);
          }
        }}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  addCategoryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    color: appShell.textPrimary,
    backgroundColor: appShell.card,
  },
  addCatBtn: {
    backgroundColor: appShell.cta,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  addCatText: { color: '#fff', fontFamily: fonts.semiBold },
  categoryCard: { marginBottom: spacing.sm },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitle: { fontFamily: fonts.bold, fontSize: 16, color: appShell.textPrimary },
  deleteText: { color: '#DC2626', fontFamily: fonts.semiBold, fontSize: 13 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.cardBorder,
  },
  productName: { fontFamily: fonts.semiBold, color: appShell.textPrimary },
  productPrice: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textSecondary },
  link: { color: appShell.cta, fontFamily: fonts.semiBold, fontSize: 13 },
  addProductBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: appShell.iceBlue,
  },
  addProductText: { fontFamily: fonts.semiBold, color: appShell.cta },
  stickyActions: { marginTop: spacing.lg },
});
