import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ScrollScreen, PrimaryButton, SectionHeader } from '@/components/ui';
import { useCatalogStore } from '@/store/catalog-store';
import type { CatalogBusinessType } from '@/lib/catalog-api';
import { spacing, radius, shadow, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';

type SellMode = 'products' | 'services';

const PRODUCT_TYPES: { key: CatalogBusinessType; label: string; emoji: string }[] = [
  { key: 'restaurant', label: 'Restaurant', emoji: '🍕' },
  { key: 'clothing', label: 'Clothing', emoji: '👗' },
  { key: 'shoes', label: 'Shoes', emoji: '👟' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
  { key: 'food', label: 'Food', emoji: '🍱' },
  { key: 'digital', label: 'Digital', emoji: '🎓' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

function initialSellMode(businessType?: CatalogBusinessType | null): SellMode | null {
  if (!businessType) return null;
  return businessType === 'services' ? 'services' : 'products';
}

export default function CatalogSetupScreen() {
  const shell = useAppShell();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  // Coming from a module card on the entry screen — mode is already decided, so we skip the picker below.
  const presetMode: SellMode | null = mode === 'products' || mode === 'services' ? mode : null;
  const {
    catalogs,
    setupCatalog,
    setCoverImage,
    isSaving: isSavingByKind,
    fetchMyCatalog,
  } = useCatalogStore();
  // No known path reaches this screen without a mode param, but fall back to 'products' as a safe default.
  const resolvedKind: SellMode = presetMode ?? 'products';
  const catalog = catalogs[resolvedKind];
  const isSaving = isSavingByKind[resolvedKind];

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog(resolvedKind);
    }, [fetchMyCatalog, resolvedKind])
  );

  // Keep empty on first setup; only prefill when an existing non-default store name is already saved.
  const initialName = useMemo(() => {
    const existing = catalog?.storeName?.trim();
    if (existing && existing !== 'My Catalog') return existing;
    return '';
  }, [catalog?.storeName]);

  const [sellMode, setSellMode] = useState<SellMode | null>(
    presetMode ?? initialSellMode(catalog?.businessType)
  );
  const [storeName, setStoreName] = useState(initialName);
  const [productType, setProductType] = useState<CatalogBusinessType>(
    catalog?.businessType && catalog.businessType !== 'services' ? catalog.businessType : 'other'
  );
  const [description, setDescription] = useState(catalog?.description ?? '');
  const [coverImageUrl, setCoverImageUrlLocal] = useState(catalog?.coverImageUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const businessType: CatalogBusinessType | null =
    sellMode === 'services' ? 'services' : sellMode === 'products' ? productType : null;

  const canContinue =
    storeName.trim().length > 0 &&
    Boolean(sellMode) &&
    Boolean(businessType) &&
    Boolean(coverImageUrl);

  const pickCoverImage = async (useCamera: boolean) => {
    if (!sellMode) return;
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to add a cover photo.');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      setUploadingCover(true);
      await setCoverImage(
        sellMode,
        asset.uri,
        asset.fileName ?? 'cover.jpg',
        asset.mimeType ?? 'image/jpeg'
      );
      setCoverImageUrlLocal(useCatalogStore.getState().catalogs[sellMode]?.coverImageUrl ?? null);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const showCoverImageOptions = () => {
    const options = ['Take photo', 'Choose from gallery', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, (idx) => {
        if (idx === 0) void pickCoverImage(true);
        if (idx === 1) void pickCoverImage(false);
      });
    } else {
      Alert.alert('Cover photo', 'Choose a source', [
        { text: 'Take photo', onPress: () => void pickCoverImage(true) },
        { text: 'Gallery', onPress: () => void pickCoverImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const onContinue = async () => {
    if (!canContinue || !businessType || !sellMode) return;
    try {
      await setupCatalog(sellMode, {
        storeName: storeName.trim(),
        businessType,
        description: description.trim() || undefined,
      });
      router.replace({
        pathname: '/account-screens/catalog-builder',
        params: { kind: sellMode },
      } as never);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const catalogKindLabel = sellMode === 'services' ? 'Service catalog' : 'Product catalog';

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader
        title={
          presetMode === 'services'
            ? 'Service Catalog'
            : presetMode === 'products'
              ? 'Product Catalog'
              : 'My Storefront'
        }
        subtitle="Set up what you share with followers"
      />

      {presetMode ? null : (
        <>
          <Text style={[styles.label, { color: shell.textPrimary }]}>What do you sell?</Text>
          <View style={styles.modeRow}>
            {(
              [
                {
                  key: 'products' as const,
                  title: 'Products',
                  hint: 'Burger, clothes, etc.',
                  icon: 'bag-handle-outline' as const,
                },
                {
                  key: 'services' as const,
                  title: 'Services',
                  hint: 'Makeup, cleaning, consultation',
                  icon: 'calendar-outline' as const,
                },
              ] as const
            ).map((opt) => {
              const active = sellMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.modeCard,
                    shadow.card,
                    {
                      backgroundColor: active ? shell.cta : shell.card,
                      borderColor: active ? shell.cta : shell.cardBorder,
                    },
                  ]}
                  onPress={() => setSellMode(opt.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View
                    style={[
                      styles.modeIconWell,
                      {
                        backgroundColor: active ? 'rgba(255,255,255,0.16)' : shell.iceBlue,
                      },
                    ]}
                  >
                    <Ionicons name={opt.icon} size={26} color={active ? '#fff' : shell.cta} />
                  </View>
                  <Text style={[styles.modeTitle, { color: active ? '#fff' : shell.textPrimary }]}>
                    {opt.title}
                  </Text>
                  <Text
                    style={[
                      styles.modeHint,
                      { color: active ? 'rgba(255,255,255,0.85)' : shell.textSecondary },
                    ]}
                  >
                    {opt.hint}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {sellMode ? (
        <>
          <Text style={[styles.kindHint, { color: shell.textSecondary }]}>
            You'll build a {catalogKindLabel.toLowerCase()}.
          </Text>

          <Text style={[styles.label, { color: shell.textPrimary }]}>Storefront name</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.cardBorder,
                color: shell.textPrimary,
                backgroundColor: shell.card,
              },
            ]}
            value={storeName}
            onChangeText={setStoreName}
            placeholder={
              sellMode === 'services' ? "e.g. Maya's Makeup Studio" : "e.g. Parul's Closet"
            }
            placeholderTextColor={shell.textMuted}
          />

          <Text style={[styles.label, { color: shell.textPrimary }]}>Cover photo</Text>
          <TouchableOpacity
            style={[
              styles.coverImageBox,
              { borderColor: shell.cardBorder, backgroundColor: shell.canvasAlt },
            ]}
            onPress={showCoverImageOptions}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <ActivityIndicator color={shell.cta} />
            ) : coverImageUrl ? (
              <Image
                source={{ uri: coverImageUrl }}
                style={styles.coverImagePreview}
                resizeMode="cover"
              />
            ) : (
              <>
                <Text style={[styles.coverImageHint, { color: shell.textSecondary }]}>
                  📷 Tap to add a cover photo
                </Text>
                <Text style={[styles.coverImageRequired, { color: shell.textMuted }]}>
                  Required
                </Text>
              </>
            )}
          </TouchableOpacity>
          {coverImageUrl ? (
            <Text style={[styles.coverImageChangeHint, { color: shell.textSecondary }]}>
              Tap the photo to change it
            </Text>
          ) : null}

          {sellMode === 'products' ? (
            <>
              <Text style={[styles.label, { color: shell.textPrimary }]}>Product type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                {PRODUCT_TYPES.map((t) => {
                  const active = productType === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        styles.chip,
                        { backgroundColor: shell.iceBlue },
                        active && [
                          styles.chipActive,
                          { backgroundColor: shell.cta, borderColor: shell.cta },
                        ],
                      ]}
                      onPress={() => setProductType(t.key)}
                    >
                      <Text style={styles.chipEmoji}>{t.emoji}</Text>
                      <Text
                        style={[styles.chipText, { color: active ? '#fff' : shell.textPrimary }]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          <Text style={[styles.label, { color: shell.textPrimary }]}>Description (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: shell.cardBorder,
                color: shell.textPrimary,
                backgroundColor: shell.card,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={
              sellMode === 'services'
                ? 'Tell customers about your services'
                : 'Tell customers about your products'
            }
            placeholderTextColor={shell.textMuted}
            multiline
            maxLength={200}
          />
          <Text style={[styles.counter, { color: shell.textMuted }]}>{description.length}/200</Text>
          <PrimaryButton
            label="Continue →"
            onPress={() => void onContinue()}
            loading={isSaving}
            disabled={!canContinue || isSaving}
          />
        </>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  coverImageBox: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImagePreview: { width: '100%', height: '100%' },
  coverImageHint: { fontFamily: fonts.semiBold, fontSize: 15 },
  coverImageRequired: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  coverImageChangeHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  kindHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  modeIconWell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modeTitle: { fontFamily: fonts.bold, fontSize: 16 },
  modeHint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  counter: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  chipScroll: { marginBottom: spacing.sm, flexGrow: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {},
  chipEmoji: { fontSize: 16 },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13 },
});
