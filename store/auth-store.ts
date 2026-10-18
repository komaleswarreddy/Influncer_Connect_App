import { create } from 'zustand';
import { api, getApiBaseUrl } from '../lib/api';
import { useMockAuth } from '../lib/auth-config';
import {
  clearEntireSession,
  getSessionNextStep,
  getSessionToken,
  getSessionUserJson,
  setSessionNextStep,
  setSessionToken,
  setSessionUserJson,
  setAuthMethod,
} from '../lib/secure-session';
import {
  startPhoneSignup as apiStartPhoneSignup,
  confirmPhoneSignup as apiConfirmPhoneSignup,
  resendPhoneSignupCode as apiResendPhoneSignupCode,
  startPhoneOtpLogin as apiStartPhoneOtpLogin,
  verifyPhoneOtpLogin as apiVerifyPhoneOtpLogin,
  type PhoneTokenLoginResponse,
  type StartPhoneSignupResponse,
  type StartPhoneOtpLoginResponse,
} from '../lib/phone-auth-api';
import {
  startEmailSignup as apiStartEmailSignup,
  confirmEmailSignup as apiConfirmEmailSignup,
  resendEmailSignupCode as apiResendEmailSignupCode,
  startEmailOtpLogin as apiStartEmailOtpLogin,
  verifyEmailOtpLogin as apiVerifyEmailOtpLogin,
  type EmailTokenLoginResponse,
  type StartEmailSignupResponse,
} from '../lib/email-auth-api';

export type AuthNextStep = 'SET_USERNAME' | 'COMPLETE_INFLUENCER_PROFILE' | null;

/** Where to send the user after sign-in (Cognito or password) based on server `nextStep`. */
export function getInfluencerEntryPath(
  nextStep: AuthNextStep | null | undefined
): '/influencer/set-username' | '/influencer/dashboard' {
  if (nextStep === 'SET_USERNAME') return '/influencer/set-username';
  // Legacy COMPLETE_INFLUENCER_PROFILE sessions → Home (profile settings are optional)
  return '/influencer/dashboard';
}

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Influencer app username from onboarding (`SET_USERNAME`). */
  username?: string | null;
  role: { roleName: string };
  tenantId?: string;
  profileCompleted?: boolean | null;
};

type RefreshSessionOptions = {
  /** When false, a 401 keeps the cached SecureStore session (used during boot / Fast Refresh). */
  logoutOnUnauthorized?: boolean;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  nextStep: AuthNextStep;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  exchangeCognitoIdToken: (idToken: string) => Promise<void>;
  refreshSession: (options?: RefreshSessionOptions) => Promise<void>;
  clearProfileGate: () => void;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User, nextStep?: AuthNextStep) => Promise<void>;
  loadAuth: () => Promise<void>;
  mockLogin: (email: string, password: string) => Promise<void>;
  /** Phone-first signup — steps 1 & 2 of app/register/influencer.tsx + verify-phone.tsx. */
  startPhoneSignup: (phoneNumber: string, username: string) => Promise<StartPhoneSignupResponse>;
  confirmPhoneSignup: (phoneNumber: string, username: string, code: string) => Promise<void>;
  resendPhoneSignupCode: (phoneNumber: string) => Promise<void>;
  /** SMS OTP login for returning phone-first users — app/login.tsx + app/login-otp.tsx. */
  startPhoneLogin: (phoneNumber: string) => Promise<StartPhoneOtpLoginResponse>;
  verifyPhoneLogin: (phoneNumber: string, session: string, code: string) => Promise<void>;
  /** Email-first signup — app/register/influencer.tsx + verify-email.tsx. */
  startEmailSignup: (email: string) => Promise<StartEmailSignupResponse>;
  confirmEmailSignup: (email: string, code: string) => Promise<void>;
  resendEmailSignupCode: (email: string) => Promise<void>;
  /** Email OTP login for returning users — app/login.tsx + app/login-email-otp.tsx. */
  startEmailLogin: (email: string) => Promise<{ sent: boolean }>;
  verifyEmailLogin: (email: string, code: string) => Promise<void>;
}

type MeResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    countryCode?: string | null;
    timezone?: string | null;
    language?: string | null;
    isAffiliate?: boolean | null;
    role?: string;
    tenantId?: string;
    influencerStatus?: string | null;
    profileCompleted?: boolean | null;
    influencerUsername?: string | null;
    nextStep?: AuthNextStep;
  };
  role?: { id: string; roleName: string };
};

type MobileTokenLoginResponse = {
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
  nextStep?: AuthNextStep | null;
};

function mapMeUser(u: MeResponse['user'], role?: { roleName: string }): User {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.influencerUsername ?? null,
    role: { roleName: role?.roleName || u.role || 'influencer' },
    tenantId: u.tenantId,
    profileCompleted: u.profileCompleted ?? null,
  };
}

/** Shared by confirmPhoneSignup and verifyPhoneLogin — both resolve to the same
 *  {token, user, role, tenant, nextStep} shape as exchangeCognitoIdToken. */
async function applyPhoneTokenLogin(
  data: PhoneTokenLoginResponse,
  get: () => AuthState
): Promise<void> {
  if (!data?.token || !data?.user || !data?.role) {
    throw new Error('Invalid phone sign-in response from server');
  }
  const tenantId = data.tenant?.id;
  if (!tenantId) throw new Error('Tenant ID not found in phone sign-in response');
  const nextStep = data.nextStep ?? null;
  const user: User = {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    role: { roleName: data.role.roleName },
    tenantId,
    profileCompleted: nextStep ? false : true,
  };
  await get().setAuth(data.token, user, nextStep);
}

/** Shared by confirmEmailSignup and verifyEmailLogin — same {token, user, role,
 *  tenant, nextStep} shape as the phone/Cognito equivalents. */
async function applyEmailTokenLogin(
  data: EmailTokenLoginResponse,
  get: () => AuthState
): Promise<void> {
  if (!data?.token || !data?.user || !data?.role) {
    throw new Error('Invalid email sign-in response from server');
  }
  const tenantId = data.tenant?.id;
  if (!tenantId) throw new Error('Tenant ID not found in email sign-in response');
  const nextStep = data.nextStep ?? null;
  const user: User = {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    role: { roleName: data.role.roleName },
    tenantId,
    profileCompleted: nextStep ? false : true,
  };
  await get().setAuth(data.token, user, nextStep);
}

type AuthSnap = Pick<
  AuthState,
  'user' | 'token' | 'isAuthenticated' | 'isInitialized' | 'isLoading' | 'error' | 'nextStep'
>;

type AuthStoreGlobal = {
  __affiliateAuthSnap?: AuthSnap;
};

const authGlobal = globalThis as typeof globalThis & AuthStoreGlobal;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  nextStep: null,

  setAuth: async (token, user, nextStep = null) => {
    await setSessionToken(token);
    await setSessionUserJson(JSON.stringify(user));
    await setSessionNextStep(nextStep);
    set({ token, user, isAuthenticated: true, isLoading: false, error: null, nextStep });
  },

  loadAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getSessionToken();
      const userStr = await getSessionUserJson();
      const storedNext = await getSessionNextStep();
      const nextStep = (storedNext as AuthNextStep) || null;
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({
          token,
          user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          nextStep: nextStep || null,
        });
        // Soft refresh: never wipe session on boot if /me briefly fails (local API wake, Fast Refresh).
        await get().refreshSession({ logoutOnUnauthorized: false });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          nextStep: null,
        });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        nextStep: null,
      });
    }
  },

  mockLogin: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!email || !password) throw new Error('Email and password are required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters long');
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'Test',
        lastName: 'User',
        role: { roleName: 'influencer' },
        tenantId: 'mock-tenant-1',
        profileCompleted: true,
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      await get().setAuth(mockToken, mockUser, null);
    } catch (error: any) {
      console.error('Mock login error:', error);
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      if (!email || !password) throw new Error('Email and password are required');
      if (password.length < 6) throw new Error('Password must be at least 6 characters long');

      if (useMockAuth) {
        return await get().mockLogin(email, password);
      }

      const data = (await api.post('/api/auth/login', { email, password })) as {
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          isAffiliate?: boolean;
          tenantId?: string;
          role?: { roleName: string };
        };
        tenant?: { id: string };
        role?: { id: string; roleName: string };
        token: string;
      };
      if (!data?.user || !data.token) throw new Error('Invalid login response from server');
      const tenantId = data.user.tenantId || data.tenant?.id;
      if (!tenantId) throw new Error('Tenant ID not found in response');
      const roleName = data.role?.roleName || data.user.role?.roleName || 'influencer';
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: { roleName: roleName },
        tenantId,
        profileCompleted: null,
      };
      await get().setAuth(data.token, user, null);
      await get().refreshSession();
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  exchangeCognitoIdToken: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const t0 = Date.now();
      const base = getApiBaseUrl().replace(/\/+$/, '');
      // Only warm free-tier Render — local/LAN health hits the DB and adds useless latency.
      if (/onrender\.com/i.test(base)) {
        try {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), 12000);
          await fetch(`${base}/api/health`, { method: 'GET', signal: controller.signal });
          clearTimeout(t);
          if (__DEV__) console.log(`[auth] render warm ${Date.now() - t0}ms`);
        } catch {
          /* cold start may still succeed on the login POST */
        }
      }

      const tLogin = Date.now();
      const data = (await api.post('/api/auth/cognito/mobile-token-login', {
        idToken,
      })) as MobileTokenLoginResponse;
      if (__DEV__) console.log(`[auth] mobile-token-login ${Date.now() - tLogin}ms`);

      if (!data?.token || !data?.user || !data?.role) {
        throw new Error('Invalid Cognito login response from server');
      }
      const tenantId = data.tenant?.id;
      if (!tenantId) throw new Error('Tenant ID not found in Cognito login response');
      const nextStep = data.nextStep ?? null;
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: { roleName: data.role.roleName },
        tenantId,
        profileCompleted: nextStep ? false : true,
      };
      // Token-login already returns user + nextStep — skip extra /api/auth/me round-trip.
      await get().setAuth(data.token, user, nextStep);
      await setAuthMethod('hosted-ui');
      if (__DEV__) console.log(`[auth] cognito exchange total ${Date.now() - t0}ms`);
    } catch (error: any) {
      console.error('Cognito exchange error:', error);
      set({ error: error.message || 'Cognito sign-in failed', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  startPhoneSignup: async (phoneNumber, username) => {
    set({ isLoading: true, error: null });
    try {
      return await apiStartPhoneSignup(phoneNumber, username);
    } catch (error: any) {
      set({ error: error.message || 'Could not start sign-up' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmPhoneSignup: async (phoneNumber, username, code) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiConfirmPhoneSignup(phoneNumber, username, code);
      await applyPhoneTokenLogin(data, get);
    } catch (error: any) {
      console.error('Phone signup confirm error:', error);
      set({ error: error.message || 'Could not confirm sign-up', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendPhoneSignupCode: async (phoneNumber) => {
    try {
      await apiResendPhoneSignupCode(phoneNumber);
    } catch (error: any) {
      set({ error: error.message || 'Could not resend code' });
      throw error;
    }
  },

  startPhoneLogin: async (phoneNumber) => {
    set({ isLoading: true, error: null });
    try {
      return await apiStartPhoneOtpLogin(phoneNumber);
    } catch (error: any) {
      set({ error: error.message || 'Could not start phone sign-in' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyPhoneLogin: async (phoneNumber, session, code) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiVerifyPhoneOtpLogin(phoneNumber, session, code);
      await applyPhoneTokenLogin(data, get);
    } catch (error: any) {
      console.error('Phone OTP login error:', error);
      set({ error: error.message || 'Could not sign you in', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  startEmailSignup: async (email) => {
    set({ isLoading: true, error: null });
    try {
      return await apiStartEmailSignup(email);
    } catch (error: any) {
      set({ error: error.message || 'Could not start sign-up' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmEmailSignup: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiConfirmEmailSignup(email, code);
      await applyEmailTokenLogin(data, get);
    } catch (error: any) {
      console.error('Email signup confirm error:', error);
      set({ error: error.message || 'Could not confirm sign-up', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendEmailSignupCode: async (email) => {
    try {
      await apiResendEmailSignupCode(email);
    } catch (error: any) {
      set({ error: error.message || 'Could not resend code' });
      throw error;
    }
  },

  startEmailLogin: async (email) => {
    set({ isLoading: true, error: null });
    try {
      return await apiStartEmailOtpLogin(email);
    } catch (error: any) {
      set({ error: error.message || 'Could not start email sign-in' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmailLogin: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiVerifyEmailOtpLogin(email, code);
      await applyEmailTokenLogin(data, get);
    } catch (error: any) {
      console.error('Email OTP login error:', error);
      set({ error: error.message || 'Could not sign you in', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshSession: async (options?: RefreshSessionOptions) => {
    const logoutOnUnauthorized = options?.logoutOnUnauthorized !== false;
    const token = get().token;
    if (!token) return;
    try {
      const res = (await api.get('/api/auth/me')) as MeResponse;
      if (!res?.user) return;
      const user = mapMeUser(res.user, res.role);
      const nextStep = (res.user.nextStep ?? null) as AuthNextStep;
      await setSessionUserJson(JSON.stringify(user));
      await setSessionNextStep(nextStep);
      set({ user, nextStep });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isAuthFailure =
        /Token expired|Unauthorized|Invalid token|401/i.test(msg) || /status:\s*401/i.test(msg);
      if (isAuthFailure && logoutOnUnauthorized) {
        await get().logout();
        return;
      }
      console.warn('refreshSession skipped:', e);
    }
  },

  clearProfileGate: () => {
    void setSessionNextStep(null);
    set((s) => {
      const user = s.user ? { ...s.user, profileCompleted: true as boolean } : null;
      if (user) void setSessionUserJson(JSON.stringify(user));
      return { nextStep: null, user };
    });
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const nameParts = String(formData.fullName || '')
        .trim()
        .split(/\s+/);
      const firstName = formData.firstName || nameParts[0] || 'New';
      const lastName = formData.lastName || nameParts.slice(1).join(' ') || 'User';
      const mockUser: User = {
        id: '2',
        email: formData.email,
        firstName,
        lastName,
        role: { roleName: 'influencer' },
        tenantId: 'mock-tenant-2',
        profileCompleted: true,
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      await get().setAuth(mockToken, mockUser, null);
    } catch (error: any) {
      set({ error: error.message || 'Registration failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await clearEntireSession();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
        nextStep: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
        nextStep: null,
      });
    }
  },
}));

/** Keep session across Metro Fast Refresh so UI edits don't bounce to login. */
if (__DEV__) {
  const prev = authGlobal.__affiliateAuthSnap;
  if (prev?.isAuthenticated && prev.token) {
    useAuthStore.setState(prev);
  }
  useAuthStore.subscribe((state) => {
    authGlobal.__affiliateAuthSnap = {
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isInitialized: state.isInitialized,
      isLoading: state.isLoading,
      error: state.error,
      nextStep: state.nextStep,
    };
  });
}
