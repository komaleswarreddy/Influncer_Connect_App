import { api } from './api';

/**
 * Phone-first Cognito signup + SMS OTP passwordless login — calls the server's
 * /api/auth/phone/* routes (server/routes/phone-auth.ts). See store/auth-store.ts
 * for the state that wraps these calls.
 */

export type PhoneTokenLoginResponse = {
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

export type StartPhoneSignupResponse = {
  needsCode: boolean;
  destination?: string;
  deliveryMedium?: string;
};

export type StartPhoneOtpLoginResponse = {
  session: string;
};

export async function startPhoneSignup(
  phoneNumber: string,
  username: string
): Promise<StartPhoneSignupResponse> {
  const data = await api.post('/api/auth/phone/signup', { phoneNumber, username });
  return data as StartPhoneSignupResponse;
}

export async function confirmPhoneSignup(
  phoneNumber: string,
  username: string,
  code: string
): Promise<PhoneTokenLoginResponse> {
  const data = await api.post('/api/auth/phone/confirm', { phoneNumber, username, code });
  return data as PhoneTokenLoginResponse;
}

export async function resendPhoneSignupCode(phoneNumber: string): Promise<void> {
  await api.post('/api/auth/phone/resend', { phoneNumber });
}

export async function startPhoneOtpLogin(phoneNumber: string): Promise<StartPhoneOtpLoginResponse> {
  const data = await api.post('/api/auth/phone/otp/start', { phoneNumber });
  return data as StartPhoneOtpLoginResponse;
}

export async function verifyPhoneOtpLogin(
  phoneNumber: string,
  session: string,
  code: string
): Promise<PhoneTokenLoginResponse> {
  const data = await api.post('/api/auth/phone/otp/verify', { phoneNumber, session, code });
  return data as PhoneTokenLoginResponse;
}
