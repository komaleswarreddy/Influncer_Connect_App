import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { api } from '../../lib/api';
import {
  PROFILE_NICHES,
  MAX_SUB_NICHES,
  OTHER_SUB_NICHE_MAX_LENGTH,
  SOCIAL_PLATFORMS,
  buildSocialUrl,
  isValidSocialHandle,
  subNichesFor,
  toSocialHandle,
  type SocialPlatformKey,
} from '../../constants/influencer-profile';
import { useKollab, font, space, type as kType, choiceChipColors } from '@/theme/kollab-tokens';
import { KollabButton, KollabSelect, KollabTextField, showKollabToast } from '@/components/ui';
import type { KollabTokens } from '@/theme/kollab-tokens';

const NICHE_OPTIONS = PROFILE_NICHES.map((niche) => ({ value: niche, label: niche }));
const DEFAULT_COUNTRY = 'India';

interface ProfileSectionProps {
  onUpdate?: () => void;
}

interface ProfileData {
  username: string;
  email: string;
  phone: string;
  country: string;
  niche: string;
  /** Chips picked from the category's list. */
  subNiches: string[];
  /** The "Other" sub-niche text; empty when Other is off. */
  otherSubNiche: string;
  otherOn: boolean;
  bio: string;
  /** Just the handle for each platform; the link prefix is fixed. */
  social: Record<SocialPlatformKey, string>;
}

const EMPTY_SOCIAL: Record<SocialPlatformKey, string> = {
  instagram: '',
  youtube: '',
  twitter: '',
  reddit: '',
  linkedin: '',
};

interface ProfileResponse {
  id: string;
  userId: string;
  username?: string | null;
  niche: string;
  subNiches?: string[];
  country: string;
  bio: string;
  socialMedia: Partial<Record<SocialPlatformKey, string>>;
  status: string;
  metrics: unknown;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    countryCode?: string;
    timezone?: string;
    language?: string;
    tenantId: string;
  };
}

function normalizeUsername(raw: string): string {
  return raw.replace(/^@+/, '').trim().replace(/\s+/g, ' ');
}

/** Ignore server placeholders like niche=general that aren't in the niche list. */
function allowedNiche(raw?: string | null): string {
  const v = (raw || '').trim();
  return PROFILE_NICHES.includes(v) ? v : '';
}

function getValidationError(formData: ProfileData): string | null {
  const username = normalizeUsername(formData.username);
  if (!username || username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be at most 30 characters';
  if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
    return 'Username can only contain letters, numbers, spaces, and underscores';
  }
  if (!allowedNiche(formData.niche)) return 'Please select your niche';
  const filled = SOCIAL_PLATFORMS.filter((p) => toSocialHandle(formData.social[p.key]));
  if (filled.length === 0) return 'Add at least one social link';
  for (const p of filled) {
    if (!isValidSocialHandle(toSocialHandle(formData.social[p.key])))
      return `Invalid ${p.label} username`;
  }
  if (formData.otherOn && !formData.otherSubNiche.trim())
    return 'Type your sub-niche or turn off Other';
  if (formData.bio && formData.bio.length > 500) return 'Bio must be less than 500 characters';
  return null;
}

export default function ProfileSection({ onUpdate }: ProfileSectionProps) {
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const router = useRouter();
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const clearProfileGate = useAuthStore((s) => s.clearProfileGate);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    username: normalizeUsername(user?.username || ''),
    email: user?.email || '',
    phone: '',
    country: DEFAULT_COUNTRY,
    niche: '',
    subNiches: [],
    otherSubNiche: '',
    otherOn: false,
    bio: '',
    social: { ...EMPTY_SOCIAL },
  });

  const canSave = useMemo(() => getValidationError(formData) === null, [formData]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = (await api.get('/api/influencers/profile')) as ProfileResponse;
        const niche = allowedNiche(response.niche);
        const known = subNichesFor(niche);
        const saved = response.subNiches ?? [];
        const chips = saved.filter((v) => known.includes(v));
        const custom = saved.find((v) => !known.includes(v)) ?? '';
        setFormData((prev) => ({
          ...prev,
          username: normalizeUsername(response.username || user?.username || prev.username),
          email: response.user.email || prev.email,
          phone: response.user.phone || '',
          country: DEFAULT_COUNTRY,
          niche,
          subNiches: chips,
          otherSubNiche: custom,
          otherOn: Boolean(custom),
          bio: response.bio || '',
          social: SOCIAL_PLATFORMS.reduce(
            (acc, p) => ({ ...acc, [p.key]: toSocialHandle(response.socialMedia?.[p.key] || '') }),
            { ...EMPTY_SOCIAL }
          ),
        }));
      } catch (error) {
        console.log('Could not load profile data:', error);
      }
    };
    loadProfile();
  }, [user?.username]);

  const handleSave = async () => {
    const err = getValidationError(formData);
    if (err) {
      showKollabToast(err);
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        username: normalizeUsername(formData.username),
        email: formData.email.trim() || user?.email,
        phone: formData.phone.trim() || undefined,
        country: DEFAULT_COUNTRY,
        niche: formData.niche,
        subNiches: [
          ...formData.subNiches,
          ...(formData.otherOn && formData.otherSubNiche.trim()
            ? [formData.otherSubNiche.trim()]
            : []),
        ],
        bio: formData.bio.trim() || undefined,
        termsAccepted: true,
      };
      const socialMedia: Record<string, string> = {};
      for (const p of SOCIAL_PLATFORMS) {
        const url = buildSocialUrl(p, formData.social[p.key]);
        if (url) socialMedia[p.key] = url;
      }
      body.socialMedia = socialMedia;
      await api.patch('/api/influencers/profile', body);
      const savedUsername = normalizeUsername(formData.username);
      const auth = useAuthStore.getState();
      if (auth.token && auth.user) {
        await auth.setAuth(auth.token, { ...auth.user, username: savedUsername }, auth.nextStep);
      }
      await refreshSession({ logoutOnUnauthorized: false });
      clearProfileGate();
      if (onUpdate) onUpdate();

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.replace('/influencer/dashboard');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update profile';
      showKollabToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubNiche = (sub: string) =>
    setFormData((prev) => {
      if (prev.subNiches.includes(sub))
        return { ...prev, subNiches: prev.subNiches.filter((x) => x !== sub) };
      const used = prev.subNiches.length + (prev.otherOn ? 1 : 0);
      if (used >= MAX_SUB_NICHES) {
        showKollabToast(`You can pick up to ${MAX_SUB_NICHES} sub-niches`);
        return prev;
      }
      return { ...prev, subNiches: [...prev.subNiches, sub] };
    });

  const toggleOther = () =>
    setFormData((prev) => {
      if (prev.otherOn) return { ...prev, otherOn: false, otherSubNiche: '' };
      if (prev.subNiches.length >= MAX_SUB_NICHES) {
        showKollabToast(`You can pick up to ${MAX_SUB_NICHES} sub-niches`);
        return prev;
      }
      return { ...prev, otherOn: true };
    });

  return (
    <View>
      <View style={[styles.well, { backgroundColor: kollab.color.well }]}>
        <Text style={[styles.sectionTitle, { color: kollab.color.ink }]}>Account</Text>
        <View style={styles.fields}>
          <KollabTextField
            placeholder="Your Username"
            value={formData.username}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                username: text.replace(/^@+/, '').replace(/[^a-zA-Z0-9_ ]/g, ''),
              }))
            }
            autoCapitalize="words"
            autoCorrect={false}
          />
          <KollabTextField
            placeholder="Enter your phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={[styles.well, { backgroundColor: kollab.color.well }]}>
        <Text style={[styles.sectionTitle, { color: kollab.color.ink }]}>Influencer profile</Text>
        <KollabTextField
          multiline
          placeholder="Tell us about yourself..."
          value={formData.bio}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
          maxLength={500}
          style={styles.bio}
        />
        <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Category</Text>
        <View style={styles.nicheSelect}>
          <KollabSelect
            value={formData.niche || null}
            placeholder="Select your category"
            options={NICHE_OPTIONS}
            onChange={(niche) =>
              setFormData((prev) =>
                prev.niche === niche
                  ? prev
                  : { ...prev, niche, subNiches: [], otherSubNiche: '', otherOn: false }
              )
            }
            accessibilityLabel="Select category"
          />
        </View>

        {formData.niche ? (
          <>
            <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>
              Sub-niches (pick up to {MAX_SUB_NICHES})
            </Text>
            <View style={styles.chipRow}>
              {subNichesFor(formData.niche).map((sub) => {
                const on = formData.subNiches.includes(sub);
                const chip = choiceChipColors(kollab, on);
                return (
                  <Pressable
                    key={sub}
                    onPress={() => toggleSubNiche(sub)}
                    style={[
                      styles.chip,
                      { backgroundColor: chip.backgroundColor, borderColor: chip.borderColor },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={sub}
                  >
                    <Text style={[styles.chipLabel, { color: chip.color }]}>{sub}</Text>
                  </Pressable>
                );
              })}
              {(() => {
                const chip = choiceChipColors(kollab, formData.otherOn);
                return (
                  <Pressable
                    onPress={toggleOther}
                    style={[
                      styles.chip,
                      { backgroundColor: chip.backgroundColor, borderColor: chip.borderColor },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: formData.otherOn }}
                    accessibilityLabel="Other"
                  >
                    <Text style={[styles.chipLabel, { color: chip.color }]}>Other</Text>
                  </Pressable>
                );
              })()}
            </View>
            {formData.otherOn ? (
              <KollabTextField
                placeholder="Type your sub-niche"
                value={formData.otherSubNiche}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, otherSubNiche: text }))}
                maxLength={OTHER_SUB_NICHE_MAX_LENGTH}
                style={styles.otherField}
              />
            ) : null}
          </>
        ) : null}

        <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>
          Social links (add at least one)
        </Text>
        <View style={styles.fields}>
          {SOCIAL_PLATFORMS.map((p) => (
            <View
              key={p.key}
              style={[
                styles.socialRow,
                { backgroundColor: kollab.color.card, borderColor: kollab.color.outline },
              ]}
            >
              <Ionicons
                name={p.icon}
                size={20}
                color={kollab.color.ink}
                accessibilityLabel={p.label}
              />
              <Text style={[styles.socialPrefix, { color: kollab.color.ink }]} numberOfLines={1}>
                {p.prefix.replace(/^https:\/\//, '')}
              </Text>
              <TextInput
                style={[styles.socialInput, { color: kollab.color.ink }]}
                placeholder={p.placeholder}
                placeholderTextColor={kollab.isDark ? kollab.color.inkMuted : kollab.color.inkFaint}
                value={formData.social[p.key]}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    social: { ...prev.social, [p.key]: toSocialHandle(text) },
                  }))
                }
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={`${p.label} username`}
              />
            </View>
          ))}
        </View>
      </View>

      {!canSave ? (
        <Text style={[styles.requiredHint, { color: kollab.color.ink }]}>
          {getValidationError(formData)}
        </Text>
      ) : null}

      <KollabButton
        label={isLoading ? 'Saving…' : 'Save Changes'}
        variant="ink"
        onPress={handleSave}
        disabled={!canSave || isLoading}
        loading={isLoading}
        style={styles.saveButton}
      />
    </View>
  );
}

function useKollabStyles(_kollab: KollabTokens) {
  return React.useMemo(
    () =>
      StyleSheet.create({
        well: { borderRadius: 22, padding: 18, marginBottom: 12 },
        sectionTitle: { ...kType.sectionTitle, marginBottom: 12 },
        fields: { gap: 10 },
        bio: { marginBottom: 14 },
        fieldLabel: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
          opacity: 0.62,
          marginBottom: 7,
        },
        nicheSelect: { marginBottom: 14 },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
        chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
        chipLabel: { fontFamily: font.semiBold, fontSize: 13.5 },
        otherField: { marginBottom: 14 },
        socialRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderRadius: 999,
          paddingHorizontal: 16,
          gap: 8,
        },
        socialPrefix: { fontFamily: font.body, fontSize: 13, opacity: 0.55, flexShrink: 0 },
        socialInput: {
          flex: 1,
          fontFamily: 'InstrumentSans_400Regular',
          fontSize: 14,
          paddingVertical: 14,
          minWidth: 0,
        },
        requiredHint: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.55,
          marginBottom: 10,
        },
        saveButton: { marginBottom: space.md },
      }),
    []
  );
}
