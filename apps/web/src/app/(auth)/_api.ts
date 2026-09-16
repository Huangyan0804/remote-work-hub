import type { AuthResponse, LoginRequest } from "@repo/types";
import { apiClient } from "@/lib/api-client";

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", body);
  return data;
}
