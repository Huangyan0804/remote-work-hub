"use client";

import { AuthResponse } from "@repo/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { login } from "./_api";

export function useLogin() {
  const router = useRouter(); // next/navigation
  const setAuth = useAuthStore((s) => s.setAuth);

  const mutationResult = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: login,
    meta: { silent: true },
    onSuccess: ({ token, user }: AuthResponse) => {
      setAuth(token, user);
      router.replace("/");
    },
  });
  return {
    ...mutationResult,
    login: mutationResult.mutate,
  };
}
