import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const NEXT_STEP_KEY = 'authNextStep';
const AUTH_METHOD_KEY = 'authMethod';

const LEGACY_KEYS = [TOKEN_KEY, USER_KEY, NEXT_STEP_KEY] as const;

async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignore */
  }
}

/** Prefer SecureStore; migrate leftover AsyncStorage session once. */
export async function getSessionToken(): Promise<string | null> {
  const fromSecure = await secureGet(TOKEN_KEY);
  if (fromSecure) return fromSecure;
  const legacy = await AsyncStorage.getItem(TOKEN_KEY);
  if (legacy) {
    await secureSet(TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return legacy;
  }
  return null;
}

export async function setSessionToken(token: string): Promise<void> {
  await secureSet(TOKEN_KEY, token);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await secureDelete(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getSessionUserJson(): Promise<string | null> {
  const fromSecure = await secureGet(USER_KEY);
  if (fromSecure) return fromSecure;
  const legacy = await AsyncStorage.getItem(USER_KEY);
  if (legacy) {
    await secureSet(USER_KEY, legacy);
    await AsyncStorage.removeItem(USER_KEY);
    return legacy;
  }
  return null;
}

export async function setSessionUserJson(json: string): Promise<void> {
  await secureSet(USER_KEY, json);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getSessionNextStep(): Promise<string | null> {
  const fromSecure = await secureGet(NEXT_STEP_KEY);
  if (fromSecure) return fromSecure;
  const legacy = await AsyncStorage.getItem(NEXT_STEP_KEY);
  if (legacy) {
    await secureSet(NEXT_STEP_KEY, legacy);
    await AsyncStorage.removeItem(NEXT_STEP_KEY);
    return legacy;
  }
  return null;
}

export async function setSessionNextStep(value: string | null): Promise<void> {
  if (value) await secureSet(NEXT_STEP_KEY, value);
  else await secureDelete(NEXT_STEP_KEY);
  await AsyncStorage.removeItem(NEXT_STEP_KEY);
}

/** How the current session was created. `hosted-ui` = Cognito Hosted UI / Google sign-in, which
 *  leaves a Cognito browser session that logout should also end; email/phone OTP logins don't. */
export type AuthMethod = 'hosted-ui';

export async function getAuthMethod(): Promise<AuthMethod | null> {
  const v = await secureGet(AUTH_METHOD_KEY);
  return v === 'hosted-ui' ? v : null;
}

export async function setAuthMethod(method: AuthMethod): Promise<void> {
  await secureSet(AUTH_METHOD_KEY, method);
}

export async function clearEntireSession(): Promise<void> {
  await secureDelete(AUTH_METHOD_KEY);
  await Promise.all(LEGACY_KEYS.map((k) => secureDelete(k)));
  await AsyncStorage.multiRemove([...LEGACY_KEYS]);
}

export { NEXT_STEP_KEY };
