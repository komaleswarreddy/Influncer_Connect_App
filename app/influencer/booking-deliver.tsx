import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabButton,
  KollabTextField,
  showKollabToast,
} from '@/components/ui';
import { rateCardsApi } from '@/lib/rate-cards-api';
import { useKollab, font } from '@/theme/kollab-tokens';

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function formatDeliverError(e: unknown): string {
  const msg = e instanceof Error ? e.message : 'Something went wrong';
  if (msg.includes('api_key') || msg.includes('CLOUDINARY') || msg.includes('not configured')) {
    return 'File upload is not set up on the server. Use a Google Drive or video URL instead.';
  }
  return msg;
}

export default function BookingDeliverScreen() {
  const kollab = useKollab();
  const { bookingId, title } = useLocalSearchParams<{ bookingId: string; title?: string }>();
  const router = useRouter();
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState('deliverable.jpg');
  const [pickedMime, setPickedMime] = useState<string | null>(null);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showKollabToast('Allow photo library access to upload.');
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
    setPickedName(asset.fileName ?? 'deliverable.jpg');
  };

  const submit = async () => {
    if (!bookingId) return;
    const url = normalizeUrl(link);
    if (!pickedUri && !url) {
      showKollabToast('Upload a file or paste a share link before submitting.');
      return;
    }
    try {
      setUploading(true);
      if (pickedUri) {
        const up = (await rateCardsApi.uploadDeliverable(
          pickedUri,
          pickedName,
          pickedMime ?? 'image/jpeg'
        )) as { fileUrl?: string };
        if (!up.fileUrl) {
          throw new Error(
            'Upload succeeded but no file URL returned. Try submitting a link instead.'
          );
        }
        await rateCardsApi.deliverBooking(bookingId, {
          fileUrl: up.fileUrl,
          driveLink: url ?? undefined,
          deliveryType: 'file',
        });
      } else if (url) {
        await rateCardsApi.deliverBooking(bookingId, { driveLink: url, deliveryType: 'link' });
      }
      showKollabToast('Delivery submitted for review');
      router.back();
    } catch (e) {
      showKollabToast(formatDeliverError(e));
    } finally {
      setUploading(false);
    }
  };

  if (!bookingId) {
    return (
      <ScrollScreen canvasColor={kollab.color.screen}>
        <KollabScreenHeader title="Deliver content" backTone="well" />
        <Text style={[styles.help, { color: kollab.color.ink }]}>
          Missing booking. Go back and try again.
        </Text>
      </ScrollScreen>
    );
  }

  const badge = pickedMime?.startsWith('video') ? 'Video' : pickedUri ? 'Photo' : null;

  return (
    <ScrollScreen canvasColor={kollab.color.screen}>
      <KollabScreenHeader
        title="Deliver content"
        subtitle={title ? String(title) : undefined}
        backTone="well"
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Uploads</Text>
      <View style={styles.mediaRow}>
        {pickedUri ? (
          <View style={[styles.thumbWrap, { backgroundColor: kollab.color.imgBg }]}>
            <Image source={{ uri: pickedUri }} style={styles.thumb} />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)', 'rgba(11,9,6,0.6)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            {badge ? (
              <View style={[styles.dur, { backgroundColor: kollab.color.panel }]}>
                <Text style={[styles.durText, { color: kollab.color.panelInk }]}>{badge}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Pressable
          onPress={() => void pickMedia()}
          disabled={uploading}
          style={[
            styles.dashed,
            { backgroundColor: kollab.color.well, borderColor: kollab.color.outline },
          ]}
        >
          <View style={[styles.plus, { backgroundColor: kollab.color.chartreuse }]}>
            <Text style={[styles.plusGlyph, { color: kollab.color.onChartreuse }]}>+</Text>
          </View>
          <Text style={[styles.dashedLabel, { color: kollab.color.ink }]}>Upload</Text>
        </Pressable>
      </View>

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Note to brand</Text>
      <KollabTextField
        surface="well"
        multiline
        placeholder="Anything the brand should know"
        value={note}
        onChangeText={setNote}
        editable={!uploading}
        style={styles.note}
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Content link</Text>
      <KollabTextField
        surface="well"
        placeholder="https://..."
        value={link}
        onChangeText={setLink}
        autoCapitalize="none"
        keyboardType="url"
        editable={!uploading}
        style={styles.link}
      />

      <KollabButton
        label={uploading ? 'Submitting…' : 'Submit delivery'}
        variant="ink"
        disabled={uploading}
        onPress={() => void submit()}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  help: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  thumbWrap: {
    width: 96,
    height: 132,
    borderRadius: 18,
    overflow: 'hidden',
  },
  thumb: { width: 96, height: 132 },
  dur: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durText: { fontFamily: font.bold, fontSize: 10.5 },
  dashed: {
    flex: 1,
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  plus: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusGlyph: { fontSize: 16, lineHeight: 18 },
  dashedLabel: { fontFamily: font.semiBold, fontSize: 11, opacity: 0.65 },
  note: { marginBottom: 18 },
  link: { marginBottom: 20 },
});
