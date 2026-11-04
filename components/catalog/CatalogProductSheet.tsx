import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  KollabButton,
  KollabScreenHeader,
  KollabTextField,
  showKollabToast,
  showKollabDialog,
} from '@/components/ui';
import type { CatalogProduct } from '@/lib/catalog-api';
import { useKollab, font, space, choiceChipColors } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

type VisitType = 'home' | 'salon' | 'center' | 'online' | 'virtual';
type PriceUnit = 'per_session' | 'per_hour';

type Props = {
  visible: boolean;
  categoryName: string;
  product?: CatalogProduct | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    price: number;
    description?: string;
    imageUrl: string;
    durationMinutes?: number;
    visitType?: VisitType;
    priceUnit?: PriceUnit;
  }) => Promise<void>;
  onUploadImage: (uri: string, fileName: string, mimeType: string) => Promise<string>;
  itemLabel?: string;
};

const VISIT_OPTIONS: { key: VisitType; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'center', label: 'Center' },
  { key: 'online', label: 'Online' },
  { key: 'virtual', label: 'Virtual' },
];

const PRICE_UNIT_OPTIONS: { key: PriceUnit; label: string }[] = [
  { key: 'per_session', label: 'Per session' },
  { key: 'per_hour', label: 'Per hour' },
];

function formatDeliverError(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Something went wrong';
  if (msg.includes('CLOUDINARY') || msg.includes('not configured')) {
    return 'Image upload is not set up on the server. Configure Cloudinary or try again later.';
  }
  return msg;
}

export function CatalogProductSheet({
  visible,
  categoryName,
  product,
  onClose,
  onSave,
  onUploadImage,
  itemLabel = 'product',
}: Props) {
  const kollab = useKollab();
  const insets = useSafeAreaInsets();
  const styles = useStyles(kollab);
  const isService = itemLabel === 'service';
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [visitType, setVisitType] = useState<VisitType>('home');
  const [priceUnit, setPriceUnit] = useState<PriceUnit>('per_session');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(product?.name ?? '');
      setPrice(product?.price ? String(product.price) : '');
      setDescription(product?.description ?? '');
      setImageUrl(product?.imageUrl ?? null);
      setDurationMinutes(product?.durationMinutes != null ? String(product.durationMinutes) : '60');
      setVisitType(product?.visitType ?? 'home');
      setPriceUnit(product?.priceUnit ?? 'per_session');
    }
  }, [visible, product]);

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showKollabToast(`Allow access to add a ${itemLabel} photo.`);
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
        });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      setUploading(true);
      const url = await onUploadImage(
        asset.uri,
        asset.fileName ?? 'product.jpg',
        asset.mimeType ?? 'image/jpeg'
      );
      setImageUrl(url);
    } catch (e) {
      showKollabToast(formatDeliverError(e));
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    void showKollabDialog({
      title: `${itemLabel[0]?.toUpperCase()}${itemLabel.slice(1)} photo`,
      message: 'Choose a source',
      actions: [
        { id: 'camera', label: 'Take photo', variant: 'ink' },
        { id: 'gallery', label: 'Choose from gallery', variant: 'primary' },
        { id: 'cancel', label: 'Cancel', variant: 'soft' },
      ],
    }).then((id) => {
      if (id === 'camera') void pickImage(true);
      if (id === 'gallery') void pickImage(false);
    });
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    const priceNum = Number(price);
    if (!trimmed) {
      showKollabToast(`Enter a ${itemLabel} name.`);
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      showKollabToast('Enter a valid price.');
      return;
    }
    if (!imageUrl) {
      showKollabToast(`Add a ${itemLabel} photo before saving.`);
      return;
    }
    let durationNum: number | undefined;
    if (isService) {
      durationNum = Number(durationMinutes);
      if (!Number.isFinite(durationNum) || durationNum < 5) {
        showKollabToast('Enter duration in minutes (at least 5).');
        return;
      }
    }
    setSaving(true);
    try {
      await onSave({
        name: trimmed,
        price: priceNum,
        description: description.trim() || undefined,
        imageUrl,
        ...(isService
          ? {
              durationMinutes: durationNum,
              visitType,
              priceUnit,
            }
          : {}),
      });
      onClose();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : `Failed to save ${itemLabel}`);
    } finally {
      setSaving(false);
    }
  };

  const title = product ? `Edit ${itemLabel}` : `Add ${itemLabel}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView
        style={[styles.sheet, { backgroundColor: kollab.color.screen }]}
        contentContainerStyle={[
          styles.sheetContent,
          { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <KollabScreenHeader title={title} subtitle={categoryName} onBack={onClose} />

        <Pressable
          style={[
            styles.imageBox,
            { borderColor: kollab.color.outline, backgroundColor: kollab.color.well },
          ]}
          onPress={showImageOptions}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={`Add ${itemLabel} photo`}
        >
          {uploading ? (
            <ActivityIndicator color={kollab.color.ink} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.preview} contentFit="contain" />
          ) : (
            <>
              <Text style={[styles.imageHint, { color: kollab.color.ink }]}>Tap to add photo</Text>
              <Text style={[styles.imageRequired, { color: kollab.color.ink }]}>Required</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.label, { color: kollab.color.ink }]}>
          {`${itemLabel[0]?.toUpperCase()}${itemLabel.slice(1)} name`}{' '}
          <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <KollabTextField
          value={name}
          onChangeText={setName}
          placeholder={isService ? 'e.g. Bridal Makeup' : 'e.g. Butter Chicken'}
        />

        <Text style={[styles.label, { color: kollab.color.ink }]}>
          Price (₹) <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <KollabTextField
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder="0"
        />

        {isService ? (
          <>
            <Text style={[styles.label, { color: kollab.color.ink }]}>
              Duration (minutes) <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <KollabTextField
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              placeholder="60"
            />

            <Text style={[styles.label, { color: kollab.color.ink }]}>Where</Text>
            <View style={styles.chipRow}>
              {VISIT_OPTIONS.map((opt) => {
                const active = visitType === opt.key;
                const chip = choiceChipColors(kollab, active);
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setVisitType(opt.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: chip.backgroundColor,
                        borderColor: chip.borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: chip.color }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { color: kollab.color.ink }]}>Price label (optional)</Text>
            <View style={styles.chipRow}>
              {PRICE_UNIT_OPTIONS.map((opt) => {
                const active = priceUnit === opt.key;
                const chip = choiceChipColors(kollab, active);
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setPriceUnit(opt.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: chip.backgroundColor,
                        borderColor: chip.borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: chip.color }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={[styles.label, { color: kollab.color.ink }]}>Description (optional)</Text>
        <KollabTextField
          value={description}
          onChangeText={setDescription}
          placeholder={isService ? "What's included in this service" : 'Brief description'}
          multiline
          maxLength={200}
          style={styles.textArea}
        />

        <View style={styles.footer}>
          <KollabButton
            label={saving ? 'Saving…' : `Save ${itemLabel}`}
            onPress={() => void handleSave()}
            disabled={saving || uploading}
          />
          <KollabButton label="Cancel" variant="soft" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
}

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        sheet: { flex: 1 },
        sheetContent: {
          paddingHorizontal: space.gutter,
        },
        imageBox: {
          height: 180,
          borderRadius: 20,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
          marginBottom: 8,
          overflow: 'hidden',
        },
        preview: { width: '100%', height: '100%' },
        imageHint: {
          fontFamily: font.semiBold,
          fontSize: 14,
        },
        imageRequired: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.55,
          marginTop: 4,
        },
        label: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
          opacity: 0.62,
          marginBottom: 7,
          marginTop: 14,
        },
        textArea: { minHeight: 88 },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
        chip: {
          borderWidth: 1.5,
          borderRadius: 999,
          paddingHorizontal: 15,
          paddingVertical: 9,
        },
        chipText: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
        },
        footer: { marginTop: 22, gap: 9 },
      }),
    [kollab]
  );
}
