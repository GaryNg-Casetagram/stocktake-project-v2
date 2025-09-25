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
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
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

      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await fetch('http://localhost:3005/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
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
          const response = await fetch('http://localhost:3005/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          const { token: newToken } = data;
          
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
