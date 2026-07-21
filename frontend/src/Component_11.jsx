import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; role: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  // Mock validation. Real auth is too complex for this demo scope.
  login: async (u, p) => {
    if (u && p.length >= 3) {
      set({ isAuthenticated: true, user: { id: 'demo-user-01', name: u, role: 'client' } });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false, user: null }),
}));