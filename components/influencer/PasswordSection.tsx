import React, { useState } from 'react';
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
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { cognitoConfigured } from '../../lib/auth-config';
import { shadow, useAppShell } from '@/theme';

interface PasswordSectionProps {
  onUpdate?: () => void;
}

function CognitoPasswordMessage() {
  const shell = useAppShell();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>Password</Text>
        <Text style={[styles.cognitoHint, { color: shell.textSecondary }]}>
          You sign in with Cognito Single Sign-On. Change your password from the Cognito Hosted UI
          (Forgot password), not from this screen.
        </Text>
      </View>
    </ScrollView>
  );
}

function EmailPasswordForm({ onUpdate }: PasswordSectionProps) {
  const shell = useAppShell();
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
    if (
      !formData.currentPassword.trim() ||
      !formData.newPassword.trim() ||
      !formData.confirmPassword.trim()
    ) {
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
      <View
        style={[styles.section, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
      >
        <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>Change Password</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>Current Password</Text>
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  borderColor: shell.borderSubtle,
                  backgroundColor: shell.canvasAlt,
                  color: shell.textPrimary,
                },
              ]}
              value={formData.currentPassword}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, currentPassword: text }))}
              placeholder="Enter your current password"
              secureTextEntry={!showCurrent}
              placeholderTextColor={shell.textMuted}
              selectionColor={shell.cta}
            />
            <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} style={styles.eyeIcon}>
              <Ionicons name={showCurrent ? 'eye' : 'eye-off'} size={22} color={shell.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>New Password</Text>
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  borderColor: shell.borderSubtle,
                  backgroundColor: shell.canvasAlt,
                  color: shell.textPrimary,
                },
              ]}
              value={formData.newPassword}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, newPassword: text }))}
              placeholder="Enter your new password"
              secureTextEntry={!showNew}
              placeholderTextColor={shell.textMuted}
              selectionColor={shell.cta}
            />
            <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeIcon}>
              <Ionicons name={showNew ? 'eye' : 'eye-off'} size={22} color={shell.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: shell.textPrimary }]}>Confirm New Password</Text>
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  borderColor: shell.borderSubtle,
                  backgroundColor: shell.canvasAlt,
                  color: shell.textPrimary,
                },
              ]}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
              placeholder="Confirm your new password"
              secureTextEntry={!showConfirm}
              placeholderTextColor={shell.textMuted}
              selectionColor={shell.cta}
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeIcon}>
              <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={22} color={shell.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.passwordRequirements, { backgroundColor: shell.iceBlue }]}>
          <Text style={[styles.requirementsTitle, { color: shell.cta }]}>
            Password Requirements:
          </Text>
          <Text style={[styles.requirement, { color: shell.textSecondary }]}>
            • At least 8 characters long
          </Text>
          <Text style={[styles.requirement, { color: shell.textSecondary }]}>
            • Include uppercase and lowercase letters
          </Text>
          <Text style={[styles.requirement, { color: shell.textSecondary }]}>
            • Include at least one number
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: shell.cta },
          isLoading && styles.saveButtonDisabled,
        ]}
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
  if (cognitoConfigured) {
    return <CognitoPasswordMessage />;
  }
  return <EmailPasswordForm {...props} />;
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
  passwordRequirements: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 13,
    marginBottom: 4,
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
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    marginLeft: 8,
    padding: 4,
  },
  cognitoHint: {
    fontSize: 14,
    lineHeight: 22,
  },
});
