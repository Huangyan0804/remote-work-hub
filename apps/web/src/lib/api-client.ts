import type { APIError } from "@repo/types";
import { REAUTH_REQUIRED_CODES } from "@repo/types";
import axios from "axios";
import { useAuthStore } from "@/lib/store";

export const apiClient = axios.create({
  baseURL: `/api`,
  timeout: 10_000,
});

// apiClient.interceptors.request.use(
//   (config) => {
//     const { token } = useAuthStore.getState();
//     if (token) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );
const needsReauth = new Set<string>(REAUTH_REQUIRED_CODES);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = (error.response?.data as Partial<APIError> | undefined)?.code;

    if (code && needsReauth.has(code)) {
      useAuthStore.getState().clearAuth();
      const { pathname, search } = window.location;
      const from = pathname.startsWith("/login") ? "/" : pathname + search;

      window.location.href = `/login?redirect=${encodeURIComponent(from)}`;
    }
    return Promise.reject(error);
  },
);
