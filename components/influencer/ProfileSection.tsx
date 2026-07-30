import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { api } from '../../lib/api';
import { INFLUENCER_COUNTRIES, INFLUENCER_NICHES } from '../../constants/influencer-profile';
import { shadow, useAppShell } from '@/theme';

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

/** Ignore server placeholders like niche=general / country=US that aren't in the chip lists. */
function allowedNiche(raw?: string | null): string {
  const v = (raw || '').trim();
  return (INFLUENCER_NICHES as readonly string[]).includes(v) ? v : '';
}

function allowedCountry(raw?: string | null): string {
  const v = (raw || '').trim();
  return (INFLUENCER_COUNTRIES as readonly string[]).includes(v) ? v : '';
}

function getValidationError(formData: ProfileData): string | null {
  const username = normalizeUsername(formData.username);
  if (!username || username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be at most 30 characters';
  if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
    return 'Username can only contain letters, numbers, spaces, and underscores';
  }
  if (!formData.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email.trim())) {
    return 'Please enter a valid email address';
  }
  if (!allowedNiche(formData.niche)) return 'Please select your niche';
  if (!allowedCountry(formData.country)) return 'Please select a country';
  const ig = formData.socialMedia.instagram.trim();
  const yt = formData.socialMedia.youtube.trim();
  if (ig && !/^https?:\/\/.+/.test(ig)) return 'Invalid Instagram URL';
  if (yt && !/^https?:\/\/.+/.test(yt)) return 'Invalid YouTube URL';
  if (formData.bio && formData.bio.length > 500) return 'Bio must be less than 500 characters';
  return null;
}

export default function ProfileSection({ onUpdate }: ProfileSectionProps) {
  const shell = useAppShell();
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
    country: '',
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
          country: allowedCountry(response.country),
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
      Alert.alert('Required fields', err);
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        username: normalizeUsername(formData.username),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        country: formData.country,
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

      // One step back (Account → Settings → Save); fallback Home if no history
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.replace('/influencer/dashboard');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>
          Personal Information
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>User Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.borderSubtle,
                backgroundColor: shell.canvasAlt,
                color: shell.textPrimary,
              },
            ]}
            value={formData.username}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                username: text.replace(/^@+/, '').replace(/[^a-zA-Z0-9_ ]/g, ''),
              }))
            }
            placeholder="Your Username"
            autoCapitalize="words"
            autoCorrect={false}
            placeholderTextColor={shell.textMuted}
            selectionColor={shell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>Email *</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.borderSubtle,
                backgroundColor: shell.canvasAlt,
                color: shell.textPrimary,
              },
            ]}
            value={formData.email}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={shell.textMuted}
            selectionColor={shell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>Phone (optional)</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.borderSubtle,
                backgroundColor: shell.canvasAlt,
                color: shell.textPrimary,
              },
            ]}
            value={formData.phone}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            placeholderTextColor={shell.textMuted}
            selectionColor={shell.cta}
          />
        </View>
      </View>

      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>Influencer Profile</Text>

        <Text style={[styles.label, { color: shell.textPrimary }]}>Niche *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {INFLUENCER_NICHES.map((niche) => (
            <TouchableOpacity
              key={niche}
              style={[
                styles.chip,
                { borderColor: shell.borderSubtle },
                formData.niche === niche && [
                  styles.chipSelected,
                  { backgroundColor: shell.cta, borderColor: shell.cta },
                ],
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, niche }))}
            >
              <Text
                style={
                  formData.niche === niche
                    ? styles.chipTextSelected
                    : [styles.chipText, { color: shell.textPrimary }]
                }
              >
                {niche}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 12, color: shell.textPrimary }]}>Country *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {INFLUENCER_COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country}
              style={[
                styles.chip,
                { borderColor: shell.borderSubtle },
                formData.country === country && [
                  styles.chipSelected,
                  { backgroundColor: shell.cta, borderColor: shell.cta },
                ],
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, country }))}
            >
              <Text
                style={
                  formData.country === country
                    ? styles.chipTextSelected
                    : [styles.chipText, { color: shell.textPrimary }]
                }
              >
                {country}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.inputGroup, { marginTop: 16 }]}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>
            Bio (optional, max 500 chars)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: shell.borderSubtle,
                backgroundColor: shell.canvasAlt,
                color: shell.textPrimary,
              },
            ]}
            value={formData.bio}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            placeholderTextColor={shell.textMuted}
            selectionColor={shell.cta}
          />
        </View>
      </View>

      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>Social Media Links</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>Instagram (optional)</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.borderSubtle,
                backgroundColor: shell.canvasAlt,
                color: shell.textPrimary,
              },
            ]}
            value={formData.socialMedia.instagram}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, instagram: text },
              }))
            }
            placeholder="https://instagram.com/yourusername"
            autoCapitalize="none"
            placeholderTextColor={shell.textMuted}
            selectionColor={shell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>YouTube (optional)</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: shell.borderSubtle,
                backgroundColor: shell.canvasAlt,
                color: shell.textPrimary,
              },
            ]}
            value={formData.socialMedia.youtube}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, youtube: text },
              }))
            }
            placeholder="https://youtube.com/@yourchannel"
            autoCapitalize="none"
            placeholderTextColor={shell.textMuted}
            selectionColor={shell.cta}
          />
        </View>
      </View>

      {!canSave ? (
        <Text style={[styles.requiredHint, { color: shell.textMuted }]}>
          Select niche and country, then save.
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: shell.cta },
          (!canSave || isLoading) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!canSave || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow.cardLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  chipScroll: {
    marginBottom: 4,
    maxHeight: 44,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  chipSelected: {},
  chipText: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#fff',
    fontSize: 13,
  },
  requiredHint: {
    marginHorizontal: 16,
    marginTop: 4,
    fontSize: 12,
  },
  saveButton: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
