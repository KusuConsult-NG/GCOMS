import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  updateUserRole: (role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      // The persisted store is the only place the token lives. It used to be
      // mirrored into a separate localStorage['token'] that api.ts read instead,
      // which meant the UI and the API could disagree about being signed in.
      setAuth: (user, token) => set({ user, token }),
      updateUserRole: (role) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        }));
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          // Clear the key older builds wrote, so a stale copy cannot linger.
          localStorage.removeItem('token');
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
