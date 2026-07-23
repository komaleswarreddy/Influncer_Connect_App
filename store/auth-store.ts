import { create } from 'zustand';
import { api } from '../lib/api';
import { useMockAuth } from '../lib/auth-config';
import {
  clearEntireSession,
  getSessionNextStep,
  getSessionToken,
  getSessionUserJson,
  setSessionNextStep,
  setSessionToken,
  setSessionUserJson,
} from '../lib/secure-session';

export type AuthNextStep = 'COMPLETE_INFLUENCER_PROFILE' | 'PENDING_PLATFORM_APPROVAL' | null;

/** Where to send the user after sign-in (Cognito or password) based on server `nextStep`. */
export function getInfluencerEntryPath(nextStep: AuthNextStep | null | undefined): string {
  if (nextStep === 'PENDING_PLATFORM_APPROVAL') return '/influencer/pending-approval';
  if (nextStep === 'COMPLETE_INFLUENCER_PROFILE') return '/account-screens/settings';
  return '/influencer/dashboard';
}

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { roleName: string };
  tenantId?: string;
  profileCompleted?: boolean | null;
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
  refreshSession: () => Promise<void>;
  clearProfileGate: () => void;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User, nextStep?: AuthNextStep) => Promise<void>;
  loadAuth: () => Promise<void>;
  mockLogin: (email: string, password: string) => Promise<void>;
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
    role: { roleName: role?.roleName || u.role || 'influencer' },
    tenantId: u.tenantId,
    profileCompleted: u.profileCompleted ?? null,
  };
}

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
        await get().refreshSession();
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
      const data = (await api.post('/api/auth/cognito/mobile-token-login', {
        idToken,
      })) as MobileTokenLoginResponse;
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
      await get().setAuth(data.token, user, nextStep);
      await get().refreshSession();
    } catch (error: any) {
      console.error('Cognito exchange error:', error);
      set({ error: error.message || 'Cognito sign-in failed', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshSession: async () => {
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
      if (isAuthFailure) {
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
