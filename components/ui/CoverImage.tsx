import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { nicheCoverSource } from '@/lib/niche-cover';
import { originalCloudinaryUrl } from '@/lib/cloudinary-url';

type Props = {
  source: ImageSource | number;
  style?: StyleProp<ViewStyle>;
};

/** A picture whose shape is wider or taller than this many times the card is shown whole (see below), not cropped. */
const MAX_CROP_RATIO = 1.7;

function remoteUri(source: ImageSource | number): string | null {
  if (
    typeof source === 'object' &&
    source !== null &&
    !Array.isArray(source) &&
    'uri' in source &&
    source.uri
  )
    return source.uri;
  return null;
}

/**
 * Fills its parent with a picture. Bundled photos simply fill the box. A picture a brand uploaded can be any shape (a square
 * logo, a tall poster), so it is cropped to fill only when its shape is close to the card's; otherwise it is shown whole on a
 * blurred copy of itself, so nothing important is cut off and there are no empty bars. If it fails to load, the niche photo is
 * shown instead, so a card is never blank.
 */
export function CoverImage({ source, style }: Props) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  // If the CDN-transformed copy cannot be loaded, the original upload is tried once before giving up on the picture.
  const [useOriginal, setUseOriginal] = useState(false);
  const rawUri = remoteUri(source);
  const uri = rawUri && useOriginal ? originalCloudinaryUrl(rawUri) : rawUri;

  if (!uri || failed) {
    return (
      <Image
        source={failed ? nicheCoverSource(null) : source}
        style={[StyleSheet.absoluteFillObject, style as object]}
        contentFit="cover"
      />
    );
  }

  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  let fit: 'cover' | 'contain' = 'cover';
  if (box && natural && box.w > 0 && box.h > 0 && natural.w > 0 && natural.h > 0) {
    const ratio = natural.w / natural.h / (box.w / box.h);
    if (ratio > MAX_CROP_RATIO || ratio < 1 / MAX_CROP_RATIO) fit = 'contain';
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, style]} onLayout={onLayout}>
      {fit === 'contain' ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          blurRadius={28}
        />
      ) : null}
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit={fit}
        transition={150}
        cachePolicy="memory-disk"
        onLoad={(e) => setNatural({ w: e.source.width, h: e.source.height })}
        onError={(e) => {
          if (!useOriginal && uri !== originalCloudinaryUrl(uri)) {
            setUseOriginal(true);
            return;
          }
          console.warn('[CoverImage] could not load', uri, e.error);
          setFailed(true);
        }}
      />
    </View>
  );
}
