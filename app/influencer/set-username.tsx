import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, KollabButton } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { useKollab, font } from '@/theme/kollab-tokens';

const USERNAME_PATTERN = /^[a-zA-Z0-9_ ]{3,30}$/;

function sanitize(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_ ]/g, '').replace(/\s+/g, ' ');
}

export default function SetUsernameScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const { refreshSession } = useAuthStore();
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => USERNAME_PATTERN.test(username), [username]);

  const onSubmit = async () => {
    if (!isValid || submitting) return;
    const cleaned = sanitize(username).trim();
    setSubmitting(true);
    setError(null);
    try {
      await api.patch('/api/influencers/username', { username: cleaned });
      await refreshSession({ logoutOnUnauthorized: false });
      useAuthStore.getState().clearProfileGate();
      router.replace('/influencer/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save your username. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      padH={24}
      style={{ backgroundColor: kollab.color.screen }}
    >
      <View style={styles.center}>
        <Text style={[styles.eyebrow, { color: kollab.color.ink }]}>one last step</Text>
        <Text style={[styles.title, { color: kollab.color.ink }]}>
          Pick your{' '}
          <Text style={{ fontFamily: font.displayItalic, color: kollab.color.violet }}>
            username
          </Text>
        </Text>
        <Text style={[styles.label, { color: kollab.color.ink }]}>Username</Text>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: kollab.color.card,
              borderColor: error ? kollab.color.heat : kollab.color.rule,
            },
          ]}
        >
          <Text style={[styles.at, { color: kollab.color.ink }]}>@</Text>
          <TextInput
            style={[styles.input, { color: kollab.color.ink }]}
            value={username}
            onChangeText={(text) => {
              setUsername(sanitize(text));
              if (error) setError(null);
            }}
            placeholder="your name"
            placeholderTextColor={kollab.isDark ? kollab.color.inkMuted : kollab.color.inkFaint}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            maxLength={30}
            onSubmitEditing={onSubmit}
            returnKeyType="done"
          />
        </View>
        <Text style={[styles.hint, { color: error ? kollab.color.heat : kollab.color.ink }]}>
          {error ?? 'This is how brands find you across collabs and your media kit.'}
        </Text>
        <KollabButton
          label={submitting ? 'Saving…' : 'Continue'}
          variant="ink"
          onPress={onSubmit}
          disabled={!isValid || submitting}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    opacity: 0.55,
  },
  title: {
    fontFamily: font.display,
    fontSize: 38,
    letterSpacing: -1,
    lineHeight: 40,
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  at: {
    fontFamily: font.body,
    fontSize: 15,
    opacity: 0.4,
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    paddingVertical: 15,
    paddingHorizontal: 6,
  },
  hint: {
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 19,
    opacity: 0.55,
    marginBottom: 24,
  },
});
