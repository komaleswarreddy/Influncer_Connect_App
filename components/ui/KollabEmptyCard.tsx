import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import { KollabButton } from './KollabButton';

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Dashed empty state — My collabs / storefront / discovery empties share this card. */
export function KollabEmptyCard({ title, subtitle, ctaLabel, onPress, style }: Props) {
  const kollab = useKollab();
  return (
    <View style={[styles.card, { borderColor: kollab.color.outline }, style]}>
      <Text style={[styles.title, { color: kollab.color.ink }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: kollab.color.ink }]}>{subtitle}</Text>
      <KollabButton label={ctaLabel} variant="ink" onPress={onPress} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 30,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    ...kType.sectionTitle,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
