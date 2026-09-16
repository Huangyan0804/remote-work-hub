import type { AuthUser } from "@repo/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
    }),
    {
      name: "rh-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
