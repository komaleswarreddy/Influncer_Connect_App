import { Linking } from 'react-native';

/** True only for absolute http(s) URLs. Blocks javascript:, intent:, file:, custom app schemes, etc. */
export function isSafeExternalUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  return /^https?:\/\/[^\s]+$/i.test(url.trim());
}

/**
 * Opens an API-provided URL in the system browser, only if it is http/https.
 * Rejects otherwise, so existing `try/catch` / `.catch` call sites show their usual error toast.
 */
export async function openExternalUrl(url: unknown): Promise<void> {
  if (!isSafeExternalUrl(url)) throw new Error('Blocked unsafe link');
  await Linking.openURL(url.trim());
}
