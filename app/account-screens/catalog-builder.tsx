import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScrollScreen, PrimaryButton, PremiumCard, SectionHeader } from '@/components/ui';
import { CatalogProductSheet } from '@/components/catalog/CatalogProductSheet';
import { useCatalogStore } from '@/store/catalog-store';
import {
  catalogProductCount,
  formatCatalogInr,
  type CatalogProduct,
  type CatalogKind,
} from '@/lib/catalog-api';
import { getRecommendedCategories } from '@/lib/catalog-recommendations';
import { spacing, radius, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';

export default function CatalogBuilderScreen() {
  const shell = useAppShell();
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

  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryChoice, setCategoryChoice] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const categoryNameInputRef = useRef<TextInput>(null);
  const isCustomCategory = categoryChoice === 'Other';

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog(kind);
    }, [fetchMyCatalog, kind])
  );

  const productCount = catalogProductCount(catalog);
  const isServiceCatalog = catalog?.businessType === 'services';
  const itemLabel = isServiceCatalog ? 'service' : 'product';
  const itemLabelPlural = isServiceCatalog ? 'services' : 'products';
  const recommendedCategories = getRecommendedCategories(catalog?.businessType);

  const onPickRecommendedCategory = (value: string) => {
    setCategoryChoice(value);
    if (value === 'Other') {
      setNewCategoryName('');
      // Give the picker a beat to close before focusing the revealed input.
      setTimeout(() => categoryNameInputRef.current?.focus(), 50);
      return;
    }
    setNewCategoryName(value);
  };

  const onAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Name required', 'Choose a category, or enter your own.');
      return;
    }
    try {
      await addCategory(kind, name);
      setNewCategoryName('');
      setCategoryChoice('');
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
        <ActivityIndicator color={shell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      safeAreaEdges={['bottom']}
      footer={
        <View>
          <Text style={[styles.previewHint, { color: shell.textSecondary }]}>
            {productCount > 0
              ? 'Looks good — add more anytime, or preview now.'
              : `Add at least one ${itemLabel} to preview your storefront.`}
          </Text>
          <PrimaryButton
            label="Preview storefront"
            disabled={productCount === 0}
            onPress={() =>
              router.push({
                pathname: '/account-screens/catalog-preview',
                params: { kind },
              } as never)
            }
          />
        </View>
      }
    >
      <SectionHeader
        title={catalog?.storeName ?? 'Build storefront'}
        subtitle={`${productCount} ${itemLabel}${productCount === 1 ? '' : 's'} in ${isServiceCatalog ? 'service catalog' : 'product catalog'}`}
      />

      <Text style={[styles.recommendedLabel, { color: shell.textSecondary }]}>Category</Text>
      <View
        style={[styles.pickerWrap, { borderColor: shell.cardBorder, backgroundColor: shell.card }]}
      >
        <Picker
          selectedValue={categoryChoice}
          onValueChange={(value) => onPickRecommendedCategory(String(value))}
        >
          <Picker.Item
            label="Choose a category…"
            value=""
            enabled={false}
            color={shell.textMuted}
          />
          {recommendedCategories.map((name) => (
            <Picker.Item key={name} label={name} value={name} color={shell.textPrimary} />
          ))}
        </Picker>
      </View>

      {isCustomCategory ? (
        <TextInput
          ref={categoryNameInputRef}
          style={[
            styles.input,
            styles.customCategoryInput,
            {
              borderColor: shell.cardBorder,
              color: shell.textPrimary,
              backgroundColor: shell.card,
            },
          ]}
          value={newCategoryName}
          onChangeText={setNewCategoryName}
          placeholder="Enter category name"
          placeholderTextColor={shell.textMuted}
        />
      ) : null}

      <TouchableOpacity
        style={[styles.addCatBtnFull, { backgroundColor: shell.cta }]}
        onPress={() => void onAddCategory()}
        disabled={isSaving}
      >
        <Text style={styles.addCatText}>+ Add category</Text>
      </TouchableOpacity>

      {catalog?.categories.map((cat) => (
        <PremiumCard key={cat.id} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.categoryTitle, { color: shell.textPrimary }]}>{cat.name}</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete category?',
                  `Remove "${cat.name}" and all its ${itemLabelPlural}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => void deleteCategory(kind, cat.id),
                    },
                  ]
                );
              }}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
          {cat.products.map((p) => (
            <View key={p.id} style={[styles.productRow, { borderTopColor: shell.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, { color: shell.textPrimary }]}>{p.name}</Text>
                <Text style={[styles.productPrice, { color: shell.textSecondary }]}>
                  {formatCatalogInr(p.price)}
                  {isServiceCatalog && p.durationMinutes ? ` · ${p.durationMinutes} min` : ''}
                  {isServiceCatalog && p.visitType
                    ? ` · ${
                        p.visitType === 'salon'
                          ? 'At salon'
                          : p.visitType === 'center'
                            ? 'Center'
                            : p.visitType === 'online'
                              ? 'Online'
                              : p.visitType === 'virtual'
                                ? 'Virtual'
                                : 'Home'
                      }`
                    : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEditProduct(cat.id, p)}>
                <Text style={[styles.link, { color: shell.cta }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(`Delete ${itemLabel}?`, p.name, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => void deleteProduct(kind, p.id),
                    },
                  ]);
                }}
              >
                <Text style={[styles.link, styles.deleteText, { color: '#DC2626' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addProductBtn, { backgroundColor: shell.iceBlue }]}
            onPress={() => openAddProduct(cat.id)}
          >
            <Text
              style={[styles.addProductText, { color: shell.cta }]}
            >{`+ Add ${itemLabel}`}</Text>
          </TouchableOpacity>
        </PremiumCard>
      ))}

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

const styles = StyleSheet.create({
  recommendedLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
  },
  customCategoryInput: {
    marginBottom: spacing.sm,
  },
  addCatBtnFull: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addCatText: { color: '#fff', fontFamily: fonts.semiBold },
  categoryCard: { marginBottom: spacing.sm },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitle: { fontFamily: fonts.bold, fontSize: 16 },
  deleteText: { color: '#DC2626', fontFamily: fonts.semiBold, fontSize: 13 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  productName: { fontFamily: fonts.semiBold },
  productPrice: { fontFamily: fonts.regular, fontSize: 13 },
  link: { fontFamily: fonts.semiBold, fontSize: 13 },
  addProductBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  addProductText: { fontFamily: fonts.semiBold },
  previewHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
