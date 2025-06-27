import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/auth-store';
import { api } from '../../lib/api';

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
  metrics: any;
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
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
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
    }
  });

  useEffect(() => {
    // Load influencer profile data
    const loadProfile = async () => {
      try {
        const response = await api.get('/api/influencers/profile') as ProfileResponse;
        setFormData(prev => ({
          ...prev,
          phone: response.user.phone || '',
          country: response.country || '',
          niche: response.niche || '',
          bio: response.bio || '',
          socialMedia: {
            instagram: response.socialMedia?.instagram || '',
            youtube: response.socialMedia?.youtube || '',
          }
        }));
      } catch (error) {
        console.log('Could not load profile data:', error);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/api/influencers/profile', formData);
      Alert.alert('Success', 'Profile updated successfully');
      if (onUpdate) onUpdate();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
            placeholder="Enter your first name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            placeholder="Enter your last name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Influencer Profile</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
            placeholder="Enter your country"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Niche</Text>
          <TextInput
            style={styles.input}
            value={formData.niche}
            onChangeText={(text) => setFormData(prev => ({ ...prev, niche: text }))}
            placeholder="e.g., Fashion, Technology, Fitness"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media Links</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia.instagram}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              socialMedia: { ...prev.socialMedia, instagram: text }
            }))}
            placeholder="https://instagram.com/yourusername"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>YouTube</Text>
          <TextInput
            style={styles.input}
            value={formData.socialMedia.youtube}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              socialMedia: { ...prev.socialMedia, youtube: text }
            }))}
            placeholder="https://youtube.com/@yourchannel"
            autoCapitalize="none"
          />
        </View>
      </View>

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
    backgroundColor: '#f8fafc',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#14b8a6',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 