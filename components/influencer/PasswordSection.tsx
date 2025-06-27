import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../../lib/api';

interface PasswordSectionProps {
  onUpdate?: () => void;
}

export default function PasswordSection({ onUpdate }: PasswordSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    if (!formData.currentPassword.trim() || !formData.newPassword.trim() || !formData.confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/influencers/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      Alert.alert('Success', 'Password updated successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (onUpdate) onUpdate();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={formData.currentPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, currentPassword: text }))}
            placeholder="Enter your current password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={formData.newPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
            placeholder="Enter your new password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            placeholder="Confirm your new password"
            secureTextEntry
          />
        </View>

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <Text style={styles.requirement}>• At least 8 characters long</Text>
          <Text style={styles.requirement}>• Include uppercase and lowercase letters</Text>
          <Text style={styles.requirement}>• Include at least one number</Text>
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
          <Text style={styles.saveButtonText}>Update Password</Text>
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
  passwordRequirements: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 13,
    color: '#0369a1',
    marginBottom: 4,
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