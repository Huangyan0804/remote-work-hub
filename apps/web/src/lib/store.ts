import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@repo/types";

export type AuthUser = Pick<User, "id" | "name" | "email" | "avatarUrl">;

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: "rh-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
