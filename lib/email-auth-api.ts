import { api } from './api';

/**
 * Email-first Cognito signup + OTP passwordless login — calls the server's
 * /api/auth/email/* routes (server/routes/email-auth.ts). See store/auth-store.ts
 * for the state that wraps these calls.
 *
 * Unlike phone's SMS_OTP (a real Cognito challenge with its own session token), the
 * login OTP here is entirely server-managed — otp/start just confirms it was sent,
 * no session to carry between start and verify.
 */

export type EmailTokenLoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isAffiliate?: boolean;
  };
  role: { id: string; roleName: string };
  tenant?: { id: string };
  nextStep?: 'SET_USERNAME' | 'COMPLETE_INFLUENCER_PROFILE' | null;
};

export type StartEmailSignupResponse = {
  needsCode: boolean;
  destination?: string;
  deliveryMedium?: string;
};

export async function startEmailSignup(email: string): Promise<StartEmailSignupResponse> {
  const data = await api.post('/api/auth/email/signup', { email });
  return data as StartEmailSignupResponse;
}

export async function confirmEmailSignup(
  email: string,
  code: string
): Promise<EmailTokenLoginResponse> {
  const data = await api.post('/api/auth/email/confirm', { email, code });
  return data as EmailTokenLoginResponse;
}

export async function resendEmailSignupCode(email: string): Promise<void> {
  await api.post('/api/auth/email/resend', { email });
}

export async function startEmailOtpLogin(email: string): Promise<{ sent: boolean }> {
  const data = await api.post('/api/auth/email/otp/start', { email });
  return data as { sent: boolean };
}

export async function verifyEmailOtpLogin(
  email: string,
  code: string
): Promise<EmailTokenLoginResponse> {
  const data = await api.post('/api/auth/email/otp/verify', { email, code });
  return data as EmailTokenLoginResponse;
}
