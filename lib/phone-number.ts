/**
 * Client-side phone number helpers for phone-first signup / SMS OTP login.
 * Mirrors the normalization server/services/phone-auth.service.ts applies — this
 * copy is only for instant UI feedback before a request round-trip; the server is
 * the actual source of truth.
 */

export const DEFAULT_COUNTRY_CODE = '+91';

/** Digits-only input, exactly 10 digits (India mobile number length). */
export function isValidLocalPhoneDigits(digits: string): boolean {
  return /^\d{10}$/.test(digits);
}

export function toE164(digits: string, countryCode: string = DEFAULT_COUNTRY_CODE): string {
  return `${countryCode}${digits.replace(/\D/g, '')}`;
}

/** Strip everything but digits, capped at 10 (India mobile numbers). */
export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

/** Username rule shared with the server (server/services/phone-auth.service.ts) and
 *  the existing set-username screen (app/influencer/set-username.tsx). */
export const USERNAME_REGEX = /^[a-zA-Z0-9_ ]{3,30}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username.trim());
}

/** 6-digit numeric confirmation/OTP code, as sent by Cognito. */
export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
