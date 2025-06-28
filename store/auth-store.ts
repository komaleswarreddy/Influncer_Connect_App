import { create } from 'zustand';
import { api } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { roleName: string };
  tenantId?: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  setAuth: async (token, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false, error: null });
  },

  loadAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true, isInitialized: true, isLoading: false });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ token: null, user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting login with:', { email, password: password ? '***' : 'empty' });
      
      // Basic validation before API call
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const data = await api.post('/api/auth/login', { email, password }) as { user: any, tenant?: any, token: string };
      console.log('Login API response:', data);
      
      if (!data || !data.user || !data.token) {
        throw new Error('Invalid login response from server');
      }
      
      // Extract tenantId from tenant object or user object
      const tenantId = data.user.tenantId || data.tenant?.id;
      if (!tenantId) {
        throw new Error('Tenant ID not found in response');
      }
      
      const user = { ...data.user, tenantId };
      await get().setAuth(data.token, user);
      console.log('Login successful for user:', user.email);
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message || 'Login failed', isLoading: false });
      throw error; // Re-throw to be caught by the login component
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/api/influencers/register', formData) as { user: any, tenant?: any, token: string };
      if (!data || !data.user || !data.token) {
        throw new Error('Invalid registration response from server');
      }
      
      // Extract tenantId from tenant object or user object
      const tenantId = data.user.tenantId || data.tenant?.id;
      if (!tenantId) {
        throw new Error('Tenant ID not found in response');
      }
      
      const user = { ...data.user, tenantId };
      await get().setAuth(data.token, user);
    } catch (error: any) {
      set({ error: error.message || 'Registration failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    console.log('Logging out...');
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null, isInitialized: true });
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if AsyncStorage fails, clear the state
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null, isInitialized: true });
    }
  },
})); 