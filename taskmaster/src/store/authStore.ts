import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { generateId, hashPassword, verifyPassword } from '../utils/auth';

interface AuthStore {
  currentUser: User | null;
  users: User[];

  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      login(email, password) {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { ok: false, error: 'No existe una cuenta con ese correo.' };
        if (!verifyPassword(password, user.passwordHash))
          return { ok: false, error: 'Contraseña incorrecta.' };
        set({ currentUser: user });
        return { ok: true };
      },

      register(name, email, password) {
        const existing = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) return { ok: false, error: 'Ya existe una cuenta con ese correo.' };

        const newUser: User = {
          id: generateId(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: hashPassword(password),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }));

        return { ok: true };
      },

      logout() {
        set({ currentUser: null });
      },

      updateProfile(updates) {
        set((state) => {
          if (!state.currentUser) return state;
          const updated = { ...state.currentUser, ...updates };
          return {
            currentUser: updated,
            users: state.users.map((u) => (u.id === updated.id ? updated : u)),
          };
        });
      },
    }),
    { name: 'taskmaster-auth' }
  )
);
