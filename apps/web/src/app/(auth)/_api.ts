import type { AuthResponse, LoginRequest, RegisterRequest } from "@repo/types";
import { apiClient } from "@/lib/api-client";

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", body);
  return data;
}

export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", body);
  return data;
}
