import React, { useState } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import { signInWithCognito } from '../lib/cognito-auth';
import { loginScreen, premiumButton } from '@/theme';

const PILL = 999;

type Props = {
  mode: 'login' | 'register';
  appearance?: 'paper' | 'premium';
};

function ssoLabel(mode: 'login' | 'register') {
  return mode === 'register' ? 'Sign up' : 'Sign in';
}

export function CognitoAuthButtons({ mode, appearance = 'paper' }: Props) {
  const router = useRouter();
  const exchangeCognitoIdToken = useAuthStore((s) => s.exchangeCognitoIdToken);
  const [busy, setBusy] = useState(false);
  const label = ssoLabel(mode);

  const runCognitoFlow = async () => {
    setBusy(true);
    const t0 = Date.now();
    try {
      const { idToken } = await signInWithCognito();
      if (__DEV__) console.log(`[auth] cognito UI+token done in ${Date.now() - t0}ms`);
      const tEx = Date.now();
      await exchangeCognitoIdToken(idToken);
      if (__DEV__)
        console.log(`[auth] backend exchange ${Date.now() - tEx}ms; total ${Date.now() - t0}ms`);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      if (/cancel/i.test(msg) || /dismiss/i.test(msg)) return;
      Alert.alert(mode === 'register' ? 'Sign up failed' : 'Sign in failed', msg);
    } finally {
      setBusy(false);
    }
  };

  if (appearance === 'premium') {
    return (
      <View style={styles.premiumWrap}>
        <View style={styles.shadowHost}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={runCognitoFlow}
            disabled={busy}
            style={[styles.touchable, busy && styles.touchableDisabled]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <View style={styles.clip}>
              <LinearGradient
                colors={[...premiumButton.baseGradient]}
                locations={[...premiumButton.baseLocations]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[...premiumButton.glossGradient]}
                locations={[...premiumButton.glossLocations]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[styles.glossLayer, { height: premiumButton.glossHeightPercent }]}
                pointerEvents="none"
              />
              <View style={styles.rimHighlight} pointerEvents="none" />
              <View style={styles.contentRow}>
                {busy ? (
                  <ActivityIndicator color={premiumButton.labelColor} size="small" />
                ) : (
                  <View style={styles.iconSlot}>
                    <MaterialCommunityIcons
                      name="shield-account"
                      size={24}
                      color={premiumButton.iconColor}
                    />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Button
        mode="contained"
        buttonColor={loginScreen.primaryDark}
        textColor={loginScreen.textOnPrimary}
        onPress={runCognitoFlow}
        loading={busy}
        disabled={busy}
        style={styles.button}
        icon={() => (
          <MaterialCommunityIcons
            name="shield-account"
            size={22}
            color={loginScreen.textOnPrimary}
          />
        )}
      >
        {label}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  button: { marginVertical: 6, borderRadius: 10 },
  premiumWrap: {
    width: '100%',
    alignItems: 'center',
  },
  shadowHost: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: PILL,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: premiumButton.shadowColor,
        shadowOffset: premiumButton.shadowOffset,
        shadowOpacity: premiumButton.shadowOpacity,
        shadowRadius: premiumButton.shadowRadius,
      },
      android: {
        elevation: premiumButton.elevation,
      },
    }),
  },
  touchable: {
    width: '100%',
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: premiumButton.rimOuter,
  },
  touchableDisabled: { opacity: 0.7 },
  clip: {
    borderRadius: PILL,
    minHeight: premiumButton.minHeight,
    paddingVertical: premiumButton.padV,
    paddingHorizontal: premiumButton.padH,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  glossLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: PILL,
    borderTopRightRadius: PILL,
  },
  rimHighlight: {
    position: 'absolute',
    top: 1,
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: premiumButton.rimLine,
    borderRadius: 1,
    opacity: 0.95,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    zIndex: 2,
    paddingHorizontal: 4,
  },
  iconSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumLabel: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
    color: premiumButton.labelColor,
    letterSpacing: 0.35,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.22)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});
