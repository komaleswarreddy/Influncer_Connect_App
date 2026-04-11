import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useKindeAuth } from '@kinde/expo';
import { useAuthStore } from '../store/auth-store';
import { palette, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

export function AccountKindeLogout() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const kinde = useKindeAuth();

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={async () => {
        try {
          await kinde.logout({ revokeToken: true });
        } catch {
          /* still clear local session */
        }
        await logout();
        router.replace('/login');
      }}
    >
      <Ionicons name="log-out-outline" size={22} color={palette.error} style={{ marginRight: spacing.sm }} />
      <Text style={styles.label}>Log out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.md,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: palette.error,
  },
});
