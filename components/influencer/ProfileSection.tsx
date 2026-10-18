import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { api } from '../../lib/api';
import { PROFILE_NICHES } from '../../constants/influencer-profile';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';
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
  bio: string;
  socialMedia: {
    instagram: string;
    youtube: string;
  };
}

interface ProfileResponse {
  id: string;
  userId: string;
  username?: string | null;
  niche: string;
  country: string;
  bio: string;
  socialMedia: {
    instagram?: string;
    youtube?: string;
  };
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
  return (PROFILE_NICHES as readonly string[]).includes(v) ? v : '';
}

function getValidationError(formData: ProfileData): string | null {
  const username = normalizeUsername(formData.username);
  if (!username || username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be at most 30 characters';
  if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
    return 'Username can only contain letters, numbers, spaces, and underscores';
  }
  if (!allowedNiche(formData.niche)) return 'Please select your niche';
  const ig = formData.socialMedia.instagram.trim();
  const yt = formData.socialMedia.youtube.trim();
  if (ig && !/^https?:\/\/.+/.test(ig)) return 'Invalid Instagram URL';
  if (yt && !/^https?:\/\/.+/.test(yt)) return 'Invalid YouTube URL';
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
    bio: '',
    socialMedia: {
      instagram: '',
      youtube: '',
    },
  });

  const canSave = useMemo(() => getValidationError(formData) === null, [formData]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = (await api.get('/api/influencers/profile')) as ProfileResponse;
        setFormData((prev) => ({
          ...prev,
          username: normalizeUsername(response.username || user?.username || prev.username),
          email: response.user.email || prev.email,
          phone: response.user.phone || '',
          country: DEFAULT_COUNTRY,
          niche: allowedNiche(response.niche),
          bio: response.bio || '',
          socialMedia: {
            instagram: response.socialMedia?.instagram || '',
            youtube: response.socialMedia?.youtube || '',
          },
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
        bio: formData.bio.trim() || undefined,
        termsAccepted: true,
      };
      const ig = formData.socialMedia.instagram.trim();
      const yt = formData.socialMedia.youtube.trim();
      if (ig || yt) {
        body.socialMedia = {
          ...(ig ? { instagram: ig } : {}),
          ...(yt ? { youtube: yt } : {}),
        };
      }
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
        <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Niche</Text>
        <View style={styles.nicheSelect}>
          <KollabSelect
            inline
            value={formData.niche || null}
            placeholder="Select niche"
            options={NICHE_OPTIONS}
            onChange={(niche) => setFormData((prev) => ({ ...prev, niche }))}
            accessibilityLabel="Select niche"
          />
        </View>
        <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Social links</Text>
        <View style={styles.fields}>
          <KollabTextField
            placeholder="https://instagram.com/yourusername"
            value={formData.socialMedia.instagram}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, instagram: text },
              }))
            }
            autoCapitalize="none"
          />
          <KollabTextField
            placeholder="https://youtube.com/@yourchannel"
            value={formData.socialMedia.youtube}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, youtube: text },
              }))
            }
            autoCapitalize="none"
          />
        </View>
      </View>

      {!canSave ? (
        <Text style={[styles.requiredHint, { color: kollab.color.ink }]}>
          Select a niche, then save.
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
