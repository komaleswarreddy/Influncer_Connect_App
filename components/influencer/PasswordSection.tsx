import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { cognitoConfigured } from '../../lib/auth-config';
import { useKollab, font } from '@/theme/kollab-tokens';
import { KollabButton, KollabTextField, showKollabToast } from '@/components/ui';

interface PasswordSectionProps {
  onUpdate?: () => void;
}

export default function PasswordSection({ onUpdate }: PasswordSectionProps) {
  const kollab = useKollab();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    if (
      !formData.currentPassword.trim() ||
      !formData.newPassword.trim() ||
      !formData.confirmPassword.trim()
    ) {
      showKollabToast('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showKollabToast('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      showKollabToast('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/api/influencers/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      showKollabToast('Password updated successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (onUpdate) onUpdate();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update password';
      showKollabToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (cognitoConfigured) {
    return (
      <View>
        <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Change password</Text>
        <Text style={[styles.cognitoHint, { color: kollab.color.ink }]}>
          You sign in with Cognito Single Sign-On. Change your password from the Cognito Hosted UI
          (Forgot password), not from this screen.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Change password</Text>
      <View style={styles.fields}>
        <KollabTextField
          surface="well"
          placeholder="Current password"
          value={formData.currentPassword}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, currentPassword: text }))}
          secureTextEntry
          autoCapitalize="none"
        />
        <KollabTextField
          surface="well"
          placeholder="New password"
          value={formData.newPassword}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, newPassword: text }))}
          secureTextEntry
          autoCapitalize="none"
        />
        <KollabTextField
          surface="well"
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <KollabButton
        label={isLoading ? 'Saving…' : 'Update password'}
        variant="ink"
        onPress={() => void handleSave()}
        disabled={isLoading}
        loading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  fields: { gap: 10, marginBottom: 20 },
  cognitoHint: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.6,
  },
});
