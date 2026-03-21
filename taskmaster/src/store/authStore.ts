import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { generateId, hashPassword, verifyPassword } from '../utils/auth';

export interface GoogleProfile {
  sub: string;       // Google unique user ID
  name: string;
  email: string;
  picture?: string;
}

interface AuthStore {
  currentUser: User | null;
  users: User[];

  login:         (email: string, password: string) => { ok: boolean; error?: string };
  register:      (name: string, email: string, password: string) => { ok: boolean; error?: string };
  loginWithGoogle:  (profile: GoogleProfile) => { ok: boolean; error?: string };
  logout:        () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],

      // ── Email / password ────────────────────────────────────────────────────

      login(email, password) {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { ok: false, error: 'No existe una cuenta con ese correo.' };
        // Google-only accounts have no password
        if (!user.passwordHash)
          return { ok: false, error: 'Esta cuenta usa inicio de sesión con Google.' };
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

        set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
        return { ok: true };
      },

      // ── Google OAuth ─────────────────────────────────────────────────────────

      loginWithGoogle(profile) {
        const email = profile.email.toLowerCase();
        const existing = get().users.find((u) => u.email === email);

        if (existing) {
          // Update avatar in case it changed
          const updated = { ...existing, avatar: profile.picture ?? existing.avatar };
          set((state) => ({
            currentUser: updated,
            users: state.users.map((u) => (u.id === updated.id ? updated : u)),
          }));
        } else {
          // Auto-create account from Google profile (no password needed)
          const newUser: User = {
            id: generateId(),
            name: profile.name,
            email,
            passwordHash: '',          // empty = Google-only account
            avatar: profile.picture,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ users: [...state.users, newUser], currentUser: newUser }));
        }
        return { ok: true };
      },

      // ── Common ───────────────────────────────────────────────────────────────

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
