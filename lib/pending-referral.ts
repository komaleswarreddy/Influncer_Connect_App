import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A referral code typed on the signup screen (or arriving through a shared link) cannot be applied until the new creator is
 * signed in, so it waits here and hooks/usePendingReferralApply.ts applies it after login.
 */
const KEY = 'pendingReferralCode';
const CODE_RE = /^[A-Za-z0-9]{6}$/;

/** Trim, drop spaces and dashes, uppercase: "nxt-a4e " -> "NXTA4E". The server does the real validation. */
export function normalizeReferralInput(raw: string): string {
  return String(raw ?? '')
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

export function looksLikeReferralCode(raw: string): boolean {
  return CODE_RE.test(normalizeReferralInput(raw));
}

export async function setPendingReferral(raw: string): Promise<void> {
  const code = normalizeReferralInput(raw);
  if (!looksLikeReferralCode(code)) return;
  try {
    await AsyncStorage.setItem(KEY, code);
  } catch {
    /* best effort: the creator can still enter the code on the Referral screen */
  }
}

export async function getPendingReferral(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export async function clearPendingReferral(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
