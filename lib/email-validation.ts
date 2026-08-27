/**
 * Client-side email validation for email+OTP signup/login. This is only for instant
 * UI feedback before a request round-trip — the server (zod .email(), see
 * server/services/email-otp.service.ts's normalizeEmail) is the real source of truth,
 * and the actual strongest proof an address is real/reachable is the signup
 * confirmation code Cognito sends to it.
 */

// Deliberately conservative (not a full RFC 5322 implementation — those accept
// addresses no mail provider actually issues) — local part, single @, a domain with
// at least one dot, no whitespace.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** 6-digit numeric confirmation/OTP code. */
export function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
