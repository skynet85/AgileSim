import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean; 
  user: { id: string; name: string } | null;
  login: (u: string, p: string) => Promise<void>; 
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false, 
      user: null,
      login: async (u, p) => { 
        if (p.length < 3) throw new Error('INVALID_CREDENTIALS');
        await new Promise(resolve => setTimeout(resolve, 400)); 
        set({ isAuthenticated: true, user: { id: 'U01', name: u } });
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: 'auth-storage' }
  )
);