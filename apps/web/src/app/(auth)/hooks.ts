"use client";

import type { AuthResponse } from "@repo/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { login, register } from "./_api";

export function useLogin() {
  const router = useRouter(); // next/navigation
  const setAuth = useAuthStore((s) => s.setAuth);

  function getRedirectTarget(): string {
    const raw = new URLSearchParams(window.location.search).get("redirect");
    if (
      !raw ||
      !raw.startsWith("/") ||
      raw.startsWith("//") ||
      raw.startsWith("/\\")
    )
      return "/";
    return raw;
  }

  const mutationResult = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: login,
    meta: { silent: true },
    onSuccess: ({ user }: AuthResponse) => {
      setAuth(user);
      router.replace(getRedirectTarget());
    },
  });
  return {
    ...mutationResult,
    login: mutationResult.mutate,
  };
}

export function useRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const mutationResult = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: register,
    meta: { silent: true },
    onSuccess: ({ user }) => {
      setAuth(user);
      router.replace("/");
    },
  });
  return {
    ...mutationResult,
    register: mutationResult.mutate,
  };
}
