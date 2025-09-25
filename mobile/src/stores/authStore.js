import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

// Custom storage adapter for Expo SecureStore
const secureStorage = {
  getItem: async (name: string) => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn('SecureStore removeItem error:', error);
    }
  },
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  storeId?: string;
  warehouseId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          const { token, user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await authApi.logout(token);
          }
        } catch (error) {
          console.warn('Logout API call failed:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return false;

        try {
          const response = await authApi.refreshToken(token);
          const { token: newToken } = response.data;
          
          set({ token: newToken });
          return true;
        } catch (error) {
          console.warn('Token refresh failed:', error);
          get().logout();
          return false;
        }
      },

      initializeAuth: async () => {
        const { token } = get();
        if (!token) return;

        try {
          // Verify token is still valid
          const isValid = await get().refreshToken();
          if (isValid) {
            set({ isAuthenticated: true });
          }
        } catch (error) {
          console.warn('Auth initialization failed:', error);
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);