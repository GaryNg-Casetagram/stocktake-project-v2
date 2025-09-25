import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Custom storage adapter for browser localStorage
const localStorage = {
  getItem: (name: string) => {
    try {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(name);
      }
      return null;
    } catch (error) {
      console.warn('localStorage getItem error:', error);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(name, value);
      }
    } catch (error) {
      console.warn('localStorage setItem error:', error);
    }
  },
  removeItem: (name: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(name);
      }
    } catch (error) {
      console.warn('localStorage removeItem error:', error);
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
  loginTime: number | null;
  sessionExpiry: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initializeAuth: () => void;
  clearError: () => void;
  isSessionValid: () => boolean;
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
      loginTime: null,
      sessionExpiry: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('http://localhost:3005/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          const { token, user } = data;
          const loginTime = Date.now();
          const sessionExpiry = loginTime + (24 * 60 * 60 * 1000); // 24 hours
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            loginTime,
            sessionExpiry,
          });
          
          return { success: true };
        } catch (error: any) {
          const errorMessage = error.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          loginTime: null,
          sessionExpiry: null,
        });
      },

      isSessionValid: () => {
        const { sessionExpiry } = get();
        if (!sessionExpiry) return false;
        return Date.now() < sessionExpiry;
      },

      initializeAuth: () => {
        const { token, isSessionValid } = get();
        if (!token || !isSessionValid()) {
          get().logout();
          return;
        }
        // Session is valid, ensure authenticated state
        set({ isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loginTime: state.loginTime,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);
