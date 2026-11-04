import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
  showKollabDialog,
} from '@/components/ui';
import { useCatalogStore } from '@/store/catalog-store';
import type { CatalogBusinessType } from '@/lib/catalog-api';
import { useKollab, font, space, choiceChipColors } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

type SellMode = 'products' | 'services';

const PRODUCT_TYPES: { key: CatalogBusinessType; label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'digital', label: 'Digital' },
  { key: 'other', label: 'Other' },
];

export default function CatalogSetupScreen() {
  const kollab = useKollab();
  const styles = useStyles(kollab);
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const presetMode: SellMode | null = mode === 'products' || mode === 'services' ? mode : null;
  const {
    catalogs,
    setupCatalog,
    setCoverImage,
    isSaving: isSavingByKind,
    fetchMyCatalog,
  } = useCatalogStore();
  const resolvedKind: SellMode = presetMode ?? 'products';
  const catalog = catalogs[resolvedKind];
  const isSaving = isSavingByKind[resolvedKind];

  useFocusEffect(
    useCallback(() => {
      void fetchMyCatalog(resolvedKind);
    }, [fetchMyCatalog, resolvedKind])
  );

  const initialName = useMemo(() => {
    const existing = catalog?.storeName?.trim();
    if (existing && existing !== 'My Catalog') return existing;
    return '';
  }, [catalog?.storeName]);

  const [sellMode] = useState<SellMode>(presetMode ?? 'products');
  const [storeName, setStoreName] = useState(initialName);
  const [productType, setProductType] = useState<CatalogBusinessType>(
    catalog?.businessType && catalog.businessType !== 'services' ? catalog.businessType : 'food'
  );
  const [description, setDescription] = useState(catalog?.description ?? '');
  const [coverImageUrl, setCoverImageUrlLocal] = useState(catalog?.coverImageUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const businessType: CatalogBusinessType = sellMode === 'services' ? 'services' : productType;
  const canContinue = storeName.trim().length > 0 && Boolean(coverImageUrl);

  const pickCoverImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showKollabToast('Allow access to add a cover photo.');
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
      showKollabToast(e instanceof Error ? e.message : 'Could not upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const showCoverImageOptions = () => {
    void showKollabDialog({
      title: 'Cover photo',
      message: 'Choose a source',
      actions: [
        { id: 'camera', label: 'Take photo', variant: 'ink' },
        { id: 'gallery', label: 'Choose from gallery', variant: 'primary' },
        { id: 'cancel', label: 'Cancel', variant: 'soft' },
      ],
    }).then((id) => {
      if (id === 'camera') void pickCoverImage(true);
      if (id === 'gallery') void pickCoverImage(false);
    });
  };

  const onContinue = async () => {
    if (!canContinue) return;
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
      showKollabToast(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <ScrollScreen
      canvasColor={kollab.color.screen}
      padH={space.gutter}
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
    >
      <KollabScreenHeader
        title="Storefront setup"
        subtitle="Set up what you share with followers"
        backTone="well"
      />

      <Text style={[styles.label, { color: kollab.color.ink }]}>
        Storefront name <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <KollabTextField
        surface="well"
        value={storeName}
        onChangeText={setStoreName}
        placeholder="Your storefront name"
        style={styles.field}
      />

      <Text style={[styles.label, { color: kollab.color.ink }]}>
        Cover photo <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <Pressable
        style={[
          styles.coverWell,
          { borderColor: kollab.color.outline, backgroundColor: kollab.color.well },
        ]}
        onPress={showCoverImageOptions}
        disabled={uploadingCover}
        accessibilityRole="button"
        accessibilityLabel="Add cover photo"
      >
        {uploadingCover ? (
          <ActivityIndicator color={kollab.color.ink} />
        ) : coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.coverPreview} contentFit="contain" />
        ) : (
          <>
            <Text style={[styles.coverHint, { color: kollab.color.ink }]}>
              Tap to add cover photo
            </Text>
            <Text style={[styles.coverRequired, { color: kollab.color.ink }]}>Required</Text>
          </>
        )}
      </Pressable>

      {sellMode === 'products' ? (
        <>
          <Text style={[styles.label, { color: kollab.color.ink }]}>Product type</Text>
          <View style={styles.typeWrap}>
            {PRODUCT_TYPES.map((t) => {
              const on = productType === t.key;
              const chip = choiceChipColors(kollab, on);
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setProductType(t.key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: chip.backgroundColor,
                      borderColor: chip.borderColor,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.typeText, { color: chip.color }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Text style={[styles.label, { color: kollab.color.ink }]}>Description (optional)</Text>
      <KollabTextField
        surface="well"
        value={description}
        onChangeText={setDescription}
        placeholder={
          sellMode === 'services'
            ? 'Tell customers about your services'
            : 'Tell customers about your products'
        }
        multiline
        maxLength={200}
        style={styles.area}
      />
      <Text style={[styles.counter, { color: kollab.color.ink }]}>{description.length}/200</Text>

      <KollabButton
        label={isSaving ? 'Saving…' : 'Continue →'}
        variant="ink"
        onPress={() => void onContinue()}
        disabled={!canContinue || isSaving}
      />
    </ScrollScreen>
  );
}

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        label: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
          opacity: 0.62,
          marginBottom: 7,
        },
        field: { marginBottom: 16 },
        coverWell: {
          height: 180,
          borderRadius: 20,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          overflow: 'hidden',
        },
        coverPreview: { width: '100%', height: '100%' },
        coverHint: {
          fontFamily: font.semiBold,
          fontSize: 14,
        },
        coverRequired: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.55,
          marginTop: 4,
        },
        typeWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 22,
        },
        typeChip: {
          borderWidth: 1.5,
          borderRadius: 999,
          paddingVertical: 9,
          paddingHorizontal: 15,
        },
        typeText: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
        },
        area: { marginBottom: 6 },
        counter: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.45,
          textAlign: 'right',
          marginBottom: 20,
        },
      }),
    [kollab]
  );
}
