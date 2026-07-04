import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { kindeConfigured } from '../../lib/auth-config';
import { appShell, shadow } from '@/theme';

interface PasswordSectionProps {
  onUpdate?: () => void;
}

function KindePasswordMessage() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password</Text>
        <Text style={styles.kindeHint}>
          You sign in with Google. Your password is managed by your Google account, so there is
          nothing to change here.
        </Text>
      </View>
    </ScrollView>
  );
}

function EmailPasswordForm({ onUpdate }: PasswordSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      await api.patch('/api/influencers/password', {
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update password';
      Alert.alert('Error', msg);
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
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.currentPassword}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, currentPassword: text }))}
              placeholder="Enter your current password"
              secureTextEntry={!showCurrent}
              placeholderTextColor="#6b7280"
              selectionColor={appShell.cta}
            />
            <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} style={styles.eyeIcon}>
              <Ionicons name={showCurrent ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.newPassword}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, newPassword: text }))}
              placeholder="Enter your new password"
              secureTextEntry={!showNew}
              placeholderTextColor="#6b7280"
              selectionColor={appShell.cta}
            />
            <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeIcon}>
              <Ionicons name={showNew ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
              placeholder="Confirm your new password"
              secureTextEntry={!showConfirm}
              placeholderTextColor="#6b7280"
              selectionColor={appShell.cta}
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeIcon}>
              <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={22} color="#888" />
            </TouchableOpacity>
          </View>
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

export default function PasswordSection(props: PasswordSectionProps) {
  if (kindeConfigured) {
    return <KindePasswordMessage />;
  }
  return <EmailPasswordForm {...props} />;
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
  passwordRequirements: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 13,
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
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    marginLeft: 8,
    padding: 4,
  },
  kindeHint: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
});
