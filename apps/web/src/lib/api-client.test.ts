import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store";
import { mockUser } from "@/test/handlers";
import { server } from "@/test/server";

// 硬跳转抽在 lib/navigate 里，这里 mock 掉 —— jsdom 不允许真的导航
const { hardRedirectMock } = vi.hoisted(() => ({ hardRedirectMock: vi.fn() }));

vi.mock("@/lib/navigate", () => ({ hardRedirect: hardRedirectMock }));

function apiError(status: number, code: string) {
  return HttpResponse.json(
    {
      statusCode: status,
      code,
      message: "调试描述",
      path: "/me",
      timestamp: "",
    },
    { status },
  );
}

beforeEach(() => {
  window.history.pushState({}, "", "/health?page=1");
  useAuthStore.setState({ user: mockUser });
  hardRedirectMock.mockClear();
});

describe("apiClient 会话失效拦截", () => {
  it("AUTH_UNAUTHORIZED 时清登录态，并带来源地址跳登录页", async () => {
    server.use(http.get("/api/me", () => apiError(401, "AUTH_UNAUTHORIZED")));

    await expect(apiClient.get("/me")).rejects.toThrow();

    expect(useAuthStore.getState().user).toBeNull();
    expect(hardRedirectMock).toHaveBeenCalledWith(
      "/login?redirect=%2Fhealth%3Fpage%3D1",
    );
  });

  it("已经在登录页时来源归一化为根路径，避免来回跳", async () => {
    window.history.pushState({}, "", "/login?redirect=%2Fhealth");
    server.use(http.get("/api/me", () => apiError(401, "AUTH_UNAUTHORIZED")));

    await expect(apiClient.get("/me")).rejects.toThrow();

    expect(hardRedirectMock).toHaveBeenCalledWith("/login?redirect=%2F");
  });

  it("其他错误码不清登录态也不跳转", async () => {
    server.use(
      http.get("/api/me", () => apiError(400, "COMMON_VALIDATION_FAILED")),
    );

    await expect(apiClient.get("/me")).rejects.toThrow();

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(hardRedirectMock).not.toHaveBeenCalled();
  });
});
