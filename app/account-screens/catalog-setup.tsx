import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScrollScreen, PrimaryButton, SectionHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { useCatalogStore } from '@/store/catalog-store';
import type { CatalogBusinessType } from '@/lib/catalog-api';
import { spacing, radius, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';

const BUSINESS_TYPES: { key: CatalogBusinessType; label: string; emoji: string }[] = [
  { key: 'restaurant', label: 'Restaurant', emoji: '🍕' },
  { key: 'clothing', label: 'Clothing', emoji: '👗' },
  { key: 'shoes', label: 'Shoes', emoji: '👟' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
  { key: 'food', label: 'Food', emoji: '🍱' },
  { key: 'digital', label: 'Digital', emoji: '🎓' },
  { key: 'services', label: 'Services', emoji: '✂️' },
  { key: 'other', label: 'Other', emoji: '📦' },
];

function defaultStoreName(
  user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
): string {
  if (!user) return '';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  const email = user.email?.split('@')[0];
  return email ?? '';
}

export default function CatalogSetupScreen() {
  const shell = useAppShell();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setupCatalog, isSaving, catalog } = useCatalogStore();

  const initialName = useMemo(
    () =>
      (catalog?.storeName !== 'My Catalog' ? catalog?.storeName : defaultStoreName(user)) ??
      defaultStoreName(user),
    [catalog?.storeName, user]
  );

  const [storeName, setStoreName] = useState(initialName);
  const [businessType, setBusinessType] = useState<CatalogBusinessType>(
    catalog?.businessType ?? 'other'
  );
  const [description, setDescription] = useState(catalog?.description ?? '');

  const canContinue = storeName.trim().length > 0 && Boolean(businessType);

  const onContinue = async () => {
    if (!canContinue) return;
    try {
      await setupCatalog({
        storeName: storeName.trim(),
        businessType,
        description: description.trim() || undefined,
      });
      router.replace('/account-screens/catalog-builder' as never);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Set up catalog" subtitle="Tell us about your business" />
      <Text style={[styles.label, { color: shell.textPrimary }]}>Catalog name</Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: shell.cardBorder, color: shell.textPrimary, backgroundColor: shell.card },
        ]}
        value={storeName}
        onChangeText={setStoreName}
        placeholder="e.g. Parul's Closet"
        placeholderTextColor={shell.textMuted}
      />
      <Text style={[styles.label, { color: shell.textPrimary }]}>Business type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {BUSINESS_TYPES.map((t) => {
          const active = businessType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.chip,
                { backgroundColor: shell.iceBlue },
                active && [
                  styles.chipActive,
                  { backgroundColor: shell.cta, borderColor: shell.cta },
                ],
              ]}
              onPress={() => setBusinessType(t.key)}
            >
              <Text style={styles.chipEmoji}>{t.emoji}</Text>
              <Text style={[styles.chipText, { color: active ? '#fff' : shell.textPrimary }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={[styles.label, { color: shell.textPrimary }]}>Description (optional)</Text>
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          { borderColor: shell.cardBorder, color: shell.textPrimary, backgroundColor: shell.card },
        ]}
        value={description}
        onChangeText={setDescription}
        placeholder="Tell customers about your catalog"
        placeholderTextColor={shell.textMuted}
        multiline
        maxLength={200}
      />
      <Text style={[styles.counter, { color: shell.textMuted }]}>{description.length}/200</Text>
      <PrimaryButton
        label="Continue →"
        onPress={() => void onContinue()}
        loading={isSaving}
        disabled={!canContinue || isSaving}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
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
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  counter: {
    fontFamily: fonts.regular,
    fontSize: 12,

    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  chipScroll: { marginBottom: spacing.sm, flexGrow: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,

    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {},
  chipEmoji: { fontSize: 16 },
  chipText: { fontFamily: fonts.semiBold, fontSize: 13 },
  chipTextActive: { color: '#fff' },
});
