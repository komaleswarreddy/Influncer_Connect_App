import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { KitTemplate } from '@/lib/media-kit-api';
import { font, useKollab } from '@/theme/kollab-tokens';

/** Mini previews that mirror the four server-rendered templates (server/services/media-kit-page.ts THEMES). */
const PREVIEW: Record<
  KitTemplate,
  { bg: string; hero: string | [string, string]; card: string; ink: string; accent: string }
> = {
  classic: { bg: '#f6f4fb', hero: '#ffffff', card: '#ffffff', ink: '#1b1530', accent: '#6b3fc0' },
  bold: {
    bg: '#fbf9ff',
    hero: ['#4b2a9a', '#8a5be0'],
    card: '#ffffff',
    ink: '#1b1530',
    accent: '#6b3fc0',
  },
  minimal: { bg: '#fafaf8', hero: '#fafaf8', card: '#ffffff', ink: '#111111', accent: '#111111' },
  dark: { bg: '#0f0d17', hero: '#191625', card: '#191625', ink: '#f3f0ff', accent: '#c8f560' },
};

type Props = {
  template: KitTemplate;
  label: string;
  blurb: string;
  selected: boolean;
  onPress: () => void;
};

export function TemplateCard({ template, label, blurb, selected, onPress }: Props) {
  const kollab = useKollab();
  const c = kollab.color;
  const p = PREVIEW[template];
  const heroInk = template === 'bold' ? '#ffffff' : p.ink;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: selected ? c.violet : c.outline,
          borderWidth: selected ? 2.5 : 1.5,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} template. ${blurb}`}
    >
      <View style={[styles.preview, { backgroundColor: p.bg }]}>
        {Array.isArray(p.hero) ? (
          <LinearGradient
            colors={p.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={[styles.avatar, { backgroundColor: p.accent, borderColor: '#fff' }]} />
            <View style={[styles.line, { backgroundColor: heroInk, width: '55%' }]} />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.hero,
              {
                backgroundColor: p.hero,
                borderColor: template === 'minimal' ? '#e8e8e3' : 'transparent',
                borderWidth: 1,
              },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: p.accent, borderColor: p.accent }]} />
            <View style={[styles.line, { backgroundColor: heroInk, width: '55%' }]} />
          </View>
        )}
        <View style={[styles.block, { backgroundColor: p.card }]}>
          <View style={[styles.line, { backgroundColor: p.accent, width: '35%' }]} />
          <View style={[styles.line, { backgroundColor: p.ink, opacity: 0.25, width: '85%' }]} />
        </View>
      </View>
      <Text style={[styles.label, { color: c.ink }]}>{label}</Text>
      <Text style={[styles.blurb, { color: c.ink }]} numberOfLines={2}>
        {blurb}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, borderRadius: 18, padding: 10, gap: 6 },
  preview: { borderRadius: 10, padding: 6, gap: 5, height: 104, overflow: 'hidden' },
  hero: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    flex: 1,
  },
  avatar: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  block: { borderRadius: 6, padding: 6, gap: 4 },
  line: { height: 4, borderRadius: 2 },
  label: { fontFamily: font.bold, fontSize: 14, marginLeft: 2 },
  blurb: { fontFamily: font.body, fontSize: 12, opacity: 0.55, marginLeft: 2 },
});
