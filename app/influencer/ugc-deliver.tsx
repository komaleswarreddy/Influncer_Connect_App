import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScrollScreen, SectionHeader, PremiumCard, VideoPreview } from '@/components/ui';
import { ugcApi } from '@/lib/ugc-api';
import { appShell, spacing } from '@/theme';

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function formatDeliverError(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Something went wrong';
  if (
    msg.includes('api_key') ||
    msg.includes('CLOUDINARY') ||
    msg.includes('not configured')
  ) {
    return 'File upload is not set up on the server. Use Submit link with a Google Drive or video URL.';
  }
  return msg;
}

export default function UgcDeliverScreen() {
  const { applicationId, title } = useLocalSearchParams<{ applicationId: string; title?: string }>();
  const router = useRouter();
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedMime, setPickedMime] = useState<string | null>(null);

  const pickAndDeliver = async () => {
    if (!applicationId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPickedUri(asset.uri);
    setPickedMime(asset.mimeType ?? 'image/jpeg');
    try {
      setUploading(true);
      const up = (await ugcApi.uploadDeliverable(
        asset.uri,
        asset.fileName ?? 'deliverable.jpg',
        asset.mimeType ?? 'image/jpeg'
      )) as { fileUrl?: string };
      if (!up.fileUrl) {
        throw new Error('Upload succeeded but no file URL returned. Try submitting a link instead.');
      }
      await ugcApi.deliver(applicationId, {
        fileUrl: up.fileUrl,
        driveLink: normalizeUrl(link) ?? undefined,
        deliveryType: 'file',
      });
      Alert.alert('Submitted', 'Your content was sent to the brand for review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Upload unavailable', formatDeliverError(e));
    } finally {
      setUploading(false);
    }
  };

  const deliverLinkOnly = async () => {
    if (!applicationId) return;
    const url = normalizeUrl(link);
    if (!url) {
      Alert.alert('Link required', 'Paste a valid URL (e.g. Google Drive or video link).');
      return;
    }
    try {
      setUploading(true);
      await ugcApi.deliver(applicationId, { driveLink: url, deliveryType: 'link' });
      Alert.alert('Submitted', 'Your link was sent to the brand for review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', formatDeliverError(e));
    } finally {
      setUploading(false);
    }
  };

  if (!applicationId) {
    return (
      <ScrollScreen>
        <Text style={{ color: appShell.textSecondary }}>Missing application. Go back and try again.</Text>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader
        title="Deliver content"
        subtitle={title ? String(title) : 'Upload a file or share a link for brand review'}
      />
      <PremiumCard>
        {pickedUri ? (
          pickedMime?.startsWith('video') ? (
            <VideoPreview uri={pickedUri} aspectRatio={9 / 16} />
          ) : null
        ) : null}
        <Text style={styles.help}>
          Easiest: paste a share link and tap Submit link. Gallery upload needs Cloudinary configured
          on the server. After submit, the brand reviews on the web; approval releases payment.
        </Text>
      </PremiumCard>
      <Text style={styles.label}>Content link (Google Drive, YouTube, etc.)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        value={link}
        onChangeText={setLink}
        autoCapitalize="none"
        keyboardType="url"
        editable={!uploading}
      />
      <TouchableOpacity
        style={[styles.btn, styles.btnOutline, uploading && styles.btnDisabled]}
        disabled={uploading}
        onPress={() => void deliverLinkOnly()}
      >
        <Text style={[styles.btnText, styles.btnOutlineText]}>
          {uploading ? 'Submitting…' : 'Submit link'}
        </Text>
      </TouchableOpacity>
      <View style={styles.divider}>
        <Text style={styles.dividerText}>or</Text>
      </View>
      <TouchableOpacity
        style={[styles.btn, uploading && styles.btnDisabled]}
        disabled={uploading}
        onPress={() => void pickAndDeliver()}
      >
        <Text style={styles.btnText}>
          {uploading ? 'Uploading…' : 'Pick file from gallery & submit'}
        </Text>
      </TouchableOpacity>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  help: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: appShell.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    color: appShell.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontFamily: 'Inter_400Regular',
    color: appShell.textPrimary,
  },
  divider: { alignItems: 'center', marginVertical: spacing.sm },
  dividerText: { fontFamily: 'Inter_400Regular', color: appShell.textSecondary },
  btn: {
    backgroundColor: appShell.cta,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: appShell.cta },
  btnText: { color: '#fff', fontFamily: 'Inter_700Bold' },
  btnOutlineText: { color: appShell.cta },
});
