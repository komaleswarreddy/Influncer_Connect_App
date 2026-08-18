import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useKollab, font, uniformCard } from '@/theme/kollab-tokens';

type Props = {
  cover: ImageSource | number | null;
  name: string;
  meta: string;
  priceLabel: string;
  onPress: () => void;
};

/** 2-up catalog tile — HTML builder/preview: equal 132px thumbs, name below, not overlay PhotoCards. */
export function CatalogItemTile({ cover, name, meta, priceLabel, onPress }: Props) {
  const kollab = useKollab();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={[styles.thumb, { backgroundColor: kollab.color.imgBg }]}>
        {cover ? (
          <Image source={cover} style={StyleSheet.absoluteFillObject} contentFit="contain" />
        ) : null}
        <LinearGradient
          colors={kollab.scrimStops.tile.colors as [string, string]}
          locations={kollab.scrimStops.tile.locations as [number, number]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.price, { backgroundColor: kollab.color.chartreuse }]}>
          <Text style={[styles.priceText, { color: kollab.color.onChartreuse }]}>{priceLabel}</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.name, { color: kollab.color.ink }]} numberOfLines={2}>
          {name}
        </Text>
        {meta ? (
          <Text style={[styles.meta, { color: kollab.color.ink }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  thumb: {
    height: uniformCard.catalogThumb,
    position: 'relative',
  },
  price: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    fontFamily: font.bold,
    fontSize: 11,
  },
  copy: {
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 16,
    minHeight: 58,
    gap: 4,
  },
  name: {
    fontFamily: font.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    fontFamily: font.body,
    fontSize: 11,
    opacity: 0.55,
    marginTop: 3,
  },
});
