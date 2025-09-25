import { create } from 'zustand';

interface ApiState {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
}

export const useApiStore = create<ApiState>((set) => ({
  baseUrl: 'http://localhost:3005',
  setBaseUrl: (url: string) => set({ baseUrl: url }),
}));
