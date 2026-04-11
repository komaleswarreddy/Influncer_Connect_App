import { create } from 'zustand';
import { api } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMockAuth } from '../lib/auth-config';

export type AuthNextStep = 'COMPLETE_INFLUENCER_PROFILE' | null;

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
  exchangeKindeIdToken: (idToken: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearProfileGate: () => void;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User, nextStep?: AuthNextStep) => Promise<void>;
  loadAuth: () => Promise<void>;
  mockLogin: (email: string, password: string) => Promise<void>;
}

const NEXT_STEP_KEY = 'authNextStep';

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
  nextStep?: AuthNextStep;
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
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    if (nextStep) await AsyncStorage.setItem(NEXT_STEP_KEY, nextStep);
    else await AsyncStorage.removeItem(NEXT_STEP_KEY);
    set({ token, user, isAuthenticated: true, isLoading: false, error: null, nextStep });
  },

  loadAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const storedNext = await AsyncStorage.getItem(NEXT_STEP_KEY);
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
        user: any;
        tenant?: { id: string };
        token: string;
      };
      if (!data?.user || !data.token) throw new Error('Invalid login response from server');
      const tenantId = data.user.tenantId || data.tenant?.id;
      if (!tenantId) throw new Error('Tenant ID not found in response');
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role || { roleName: 'influencer' },
        tenantId,
        profileCompleted: data.user.profileCompleted ?? null,
      };
      await get().setAuth(data.token, user, null);
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  exchangeKindeIdToken: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = (await api.post('/api/auth/kinde/mobile-token-login', {
        idToken,
      })) as MobileTokenLoginResponse;
      if (!data?.token || !data?.user || !data?.role) {
        throw new Error('Invalid Kinde login response from server');
      }
      const tenantId = data.tenant?.id;
      if (!tenantId) throw new Error('Tenant ID not found in Kinde login response');
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: { roleName: data.role.roleName },
        tenantId,
        profileCompleted: data.nextStep ? false : true,
      };
      const nextStep = data.nextStep ?? null;
      await get().setAuth(data.token, user, nextStep);
    } catch (error: any) {
      console.error('Kinde exchange error:', error);
      set({ error: error.message || 'Kinde sign-in failed', isLoading: false });
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
      const nextStep = res.user.nextStep ?? null;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (nextStep) await AsyncStorage.setItem(NEXT_STEP_KEY, nextStep);
      else await AsyncStorage.removeItem(NEXT_STEP_KEY);
      set({ user, nextStep });
    } catch (e) {
      console.warn('refreshSession skipped:', e);
    }
  },

  clearProfileGate: () => {
    void AsyncStorage.removeItem(NEXT_STEP_KEY);
    set((s) => {
      const user = s.user ? { ...s.user, profileCompleted: true as boolean } : null;
      if (user) void AsyncStorage.setItem('user', JSON.stringify(user));
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
      await AsyncStorage.multiRemove(['token', 'user', NEXT_STEP_KEY]);
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
