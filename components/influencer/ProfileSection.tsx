import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '../../store/auth-store';
import { api } from '../../lib/api';
import { INFLUENCER_COUNTRIES, INFLUENCER_NICHES } from '../../constants/influencer-profile';
import { appShell, shadow } from '@/theme';

interface ProfileSectionProps {
  onUpdate?: () => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
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

export default function ProfileSection({ onUpdate }: ProfileSectionProps) {
  const user = useAuthStore((s) => s.user);
  const nextStep = useAuthStore((s) => s.nextStep);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
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

  const needsTerms =
    user?.profileCompleted === false ||
    nextStep === 'COMPLETE_INFLUENCER_PROFILE' ||
    nextStep === 'PENDING_PLATFORM_APPROVAL';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = (await api.get('/api/influencers/profile')) as ProfileResponse;
        setFormData((prev) => ({
          ...prev,
          phone: response.user.phone || '',
          country: response.country || '',
          niche: response.niche || '',
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
  }, []);

  const validate = (): string | null => {
    if (!formData.firstName?.trim()) return 'First name is required';
    if (!formData.lastName?.trim()) return 'Last name is required';
    if (!formData.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      return 'Invalid email address';
    }
    const ig = formData.socialMedia.instagram.trim();
    const yt = formData.socialMedia.youtube.trim();
    if (ig && !/^https?:\/\/.+/.test(ig)) return 'Invalid Instagram URL';
    if (yt && !/^https?:\/\/.+/.test(yt)) return 'Invalid YouTube URL';
    if (!formData.niche) return 'Please select your niche';
    if (!formData.country) return 'Please select a country';
    if (formData.bio && formData.bio.length > 500) return 'Bio must be less than 500 characters';
    if (needsTerms && !agreedToTerms) return 'You must agree to the terms and conditions';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        country: formData.country,
        niche: formData.niche,
        bio: formData.bio.trim() || undefined,
      };
      if (needsTerms) {
        body.termsAccepted = true;
      }
      const ig = formData.socialMedia.instagram.trim();
      const yt = formData.socialMedia.youtube.trim();
      if (ig || yt) {
        body.socialMedia = {
          ...(ig ? { instagram: ig } : {}),
          ...(yt ? { youtube: yt } : {}),
        };
      }
      await api.patch('/api/influencers/profile', body);
      await refreshSession();
      setAgreedToTerms(false);
      Alert.alert('Success', 'Profile updated successfully');
      if (onUpdate) onUpdate();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, firstName: text }))}
            placeholder="Enter your first name"
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, lastName: text }))}
            placeholder="Enter your last name"
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Influencer Profile</Text>

        <Text style={styles.label}>Niche *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {INFLUENCER_NICHES.map((niche) => (
            <TouchableOpacity
              key={niche}
              style={[styles.chip, formData.niche === niche && styles.chipSelected]}
              onPress={() => setFormData((prev) => ({ ...prev, niche }))}
            >
              <Text style={formData.niche === niche ? styles.chipTextSelected : styles.chipText}>
                {niche}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 12 }]}>Country *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {INFLUENCER_COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country}
              style={[styles.chip, formData.country === country && styles.chipSelected]}
              onPress={() => setFormData((prev) => ({ ...prev, country }))}
            >
              <Text style={formData.country === country ? styles.chipTextSelected : styles.chipText}>
                {country}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.inputGroup, { marginTop: 16 }]}>
          <Text style={styles.label}>Bio (optional, max 500 chars)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media Links</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instagram (optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia.instagram}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, instagram: text },
              }))
            }
            placeholder="https://instagram.com/yourusername"
            autoCapitalize="none"
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>YouTube (optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia.youtube}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, youtube: text },
              }))
            }
            placeholder="https://youtube.com/@yourchannel"
            autoCapitalize="none"
            placeholderTextColor="#6b7280"
            selectionColor={appShell.cta}
          />
        </View>
      </View>

      {needsTerms ? (
        <View style={styles.section}>
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              onPress={() => setAgreedToTerms((v) => !v)}
              style={styles.checkbox}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreedToTerms }}
            >
              <Text>{agreedToTerms ? '☑' : '☐'}</Text>
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>I agree to the terms and conditions</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
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
    backgroundColor: appShell.card,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    ...shadow.cardLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#111827',
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
  chipSelected: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  chipText: {
    color: '#111827',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#fff',
    fontSize: 13,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  checkboxLabel: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: appShell.cta,
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
