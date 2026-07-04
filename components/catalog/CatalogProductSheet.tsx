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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import type { CatalogProduct } from '@/lib/catalog-api';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

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
  }) => Promise<void>;
  onUploadImage: (uri: string, fileName: string, mimeType: string) => Promise<string>;
};

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
}: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(product?.name ?? '');
      setPrice(product?.price ? String(product.price) : '');
      setDescription(product?.description ?? '');
      setImageUrl(product?.imageUrl ?? null);
    }
  }, [visible, product]);

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to add a product photo.');
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
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) void pickImage(true);
          if (idx === 1) void pickImage(false);
        }
      );
    } else {
      Alert.alert('Product photo', 'Choose a source', [
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
      Alert.alert('Name required', 'Enter a product name.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      Alert.alert('Price required', 'Enter a valid price.');
      return;
    }
    if (!imageUrl) {
      Alert.alert('Photo required', 'Add a product photo before saving.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: trimmed,
        price: priceNum,
        description: description.trim() || undefined,
        imageUrl,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <Text style={styles.title}>{product ? 'Edit product' : 'Add product'}</Text>
        <Text style={styles.subtitle}>{categoryName}</Text>

        <TouchableOpacity style={styles.imageBox} onPress={showImageOptions} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color={appShell.cta} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.preview} resizeMode="contain" />
          ) : (
            <>
              <Text style={styles.imageHint}>📷 Tap to add photo</Text>
              <Text style={styles.imageRequired}>Required</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Product name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Butter Chicken"
          placeholderTextColor={appShell.textMuted}
        />

        <Text style={styles.label}>Price (₹)</Text>
        <View style={styles.priceRow}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={[styles.input, styles.priceInput]}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={appShell.textMuted}
          />
        </View>

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description"
          placeholderTextColor={appShell.textMuted}
          multiline
          maxLength={200}
        />

        <View style={styles.footer}>
          <PrimaryButton
            label="Save product"
            onPress={() => void handleSave()}
            loading={saving}
            disabled={saving || uploading}
          />
          <SecondaryButton label="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: appShell.canvas,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: { fontFamily: fonts.bold, fontSize: 20, color: appShell.textPrimary },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textSecondary,
    marginBottom: spacing.md,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 280,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  imageHint: { fontFamily: fonts.semiBold, color: appShell.textSecondary },
  imageRequired: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textMuted, marginTop: 4 },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fonts.regular,
    color: appShell.textPrimary,
    backgroundColor: appShell.card,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rupee: { fontFamily: fonts.bold, fontSize: 18, color: appShell.textPrimary },
  priceInput: { flex: 1 },
  footer: { marginTop: spacing.lg, gap: spacing.sm },
});
