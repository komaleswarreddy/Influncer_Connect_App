import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import type { CatalogProduct } from '@/lib/catalog-api';
import { spacing, radius, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';

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
  const shell = useAppShell();

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
      Alert.alert('Permission needed', `Allow access to add a ${itemLabel} photo.`);
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
      Alert.alert('Upload failed', formatDeliverError(e));
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    const options = ['Take photo', 'Choose from gallery', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: 2 }, (idx) => {
        if (idx === 0) void pickImage(true);
        if (idx === 1) void pickImage(false);
      });
    } else {
      Alert.alert(`${itemLabel[0]?.toUpperCase()}${itemLabel.slice(1)} photo`, 'Choose a source', [
        { text: 'Take photo', onPress: () => void pickImage(true) },
        { text: 'Gallery', onPress: () => void pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    const priceNum = Number(price);
    if (!trimmed) {
      Alert.alert('Name required', `Enter a ${itemLabel} name.`);
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      Alert.alert('Price required', 'Enter a valid price.');
      return;
    }
    if (!imageUrl) {
      Alert.alert('Photo required', `Add a ${itemLabel} photo before saving.`);
      return;
    }
    let durationNum: number | undefined;
    if (isService) {
      durationNum = Number(durationMinutes);
      if (!Number.isFinite(durationNum) || durationNum < 5) {
        Alert.alert('Duration required', 'Enter duration in minutes (at least 5).');
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
      Alert.alert('Error', e instanceof Error ? e.message : `Failed to save ${itemLabel}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView
        style={[styles.sheet, { backgroundColor: shell.canvas }]}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: shell.textPrimary }]}>
          {product ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
        </Text>
        <Text style={[styles.subtitle, { color: shell.textSecondary }]}>{categoryName}</Text>

        <TouchableOpacity
          style={[
            styles.imageBox,
            { borderColor: shell.cardBorder, backgroundColor: shell.canvasAlt },
          ]}
          onPress={showImageOptions}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={shell.cta} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.preview} resizeMode="contain" />
          ) : (
            <>
              <Text style={[styles.imageHint, { color: shell.textSecondary }]}>
                📷 Tap to add photo
              </Text>
              <Text style={[styles.imageRequired, { color: shell.textMuted }]}>Required</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.label, { color: shell.textPrimary }]}>
          {`${itemLabel[0]?.toUpperCase()}${itemLabel.slice(1)} name`}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: shell.cardBorder,
              color: shell.textPrimary,
              backgroundColor: shell.card,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder={isService ? 'e.g. Bridal Makeup' : 'e.g. Butter Chicken'}
          placeholderTextColor={shell.textMuted}
        />

        <Text style={[styles.label, { color: shell.textPrimary }]}>Price (₹)</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.rupee, { color: shell.textPrimary }]}>₹</Text>
          <TextInput
            style={[
              styles.input,
              styles.priceInput,
              {
                borderColor: shell.cardBorder,
                color: shell.textPrimary,
                backgroundColor: shell.card,
              },
            ]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={shell.textMuted}
          />
        </View>

        {isService ? (
          <>
            <Text style={[styles.label, { color: shell.textPrimary }]}>Duration (minutes)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: shell.cardBorder,
                  color: shell.textPrimary,
                  backgroundColor: shell.card,
                },
              ]}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor={shell.textMuted}
            />

            <Text style={[styles.label, { color: shell.textPrimary }]}>Where</Text>
            <View style={styles.chipRow}>
              {VISIT_OPTIONS.map((opt) => {
                const active = visitType === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? shell.cta : shell.iceBlue,
                        borderColor: active ? shell.cta : 'transparent',
                      },
                    ]}
                    onPress={() => setVisitType(opt.key)}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : shell.textPrimary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: shell.textPrimary }]}>Price label (optional)</Text>
            <View style={styles.chipRow}>
              {PRICE_UNIT_OPTIONS.map((opt) => {
                const active = priceUnit === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? shell.cta : shell.iceBlue,
                        borderColor: active ? shell.cta : 'transparent',
                      },
                    ]}
                    onPress={() => setPriceUnit(opt.key)}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : shell.textPrimary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
          placeholder={isService ? "What's included in this service" : 'Brief description'}
          placeholderTextColor={shell.textMuted}
          multiline
          maxLength={200}
        />

        <View style={styles.footer}>
          <PrimaryButton
            label={`Save ${itemLabel}`}
            onPress={() => void handleSave()}
            loading={saving}
            disabled={saving || uploading}
          />
          <SecondaryButton label="Cancel" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  sheetContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  title: { fontFamily: fonts.bold, fontSize: 22, marginBottom: 4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, marginBottom: spacing.md },
  imageBox: {
    height: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  imageHint: { fontFamily: fonts.semiBold, fontSize: 15 },
  imageRequired: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rupee: { fontFamily: fonts.semiBold, fontSize: 18 },
  priceInput: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13 },
  footer: { marginTop: spacing.lg, gap: spacing.sm },
});
