import { create } from 'zustand';
interface AuthState {
  isAuthenticated: boolean; user: { id: string; name: string } | null;
  login: (u: string, p: string) => Promise<boolean>; logout: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false, user: null,
  login: async (u, p) => { if (p.length >= 3) set({ isAuthenticated: true, user: { id: 'U01', name: u } }); return true; },
  logout: () => set({ isAuthenticated: false, user: null }),
}));