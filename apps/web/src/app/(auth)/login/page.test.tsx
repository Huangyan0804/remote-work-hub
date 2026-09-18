import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/store";
import { mockUser } from "@/test/handlers";
import { server } from "@/test/server";
import Login from "./page";

// 单测不加载 Next 运行时：next-i18next/client 内部 import "next/navigation"，
// 而 Next 16 的 package.json 没有 exports 字段，Node ESM 解析不了无扩展名的子路径。
// 所以 t 一律回显 key，断言时直接写 key（i18n 文案本身由 errors.json 保证）。
vi.mock("next-i18next/client", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

// Link 依赖 App Router 上下文，单测里换成普通 a 标签
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { replaceMock, toastInfoMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { info: toastInfoMock, error: vi.fn(), success: vi.fn() },
}));

/** 后端统一错误结构，只关心 code 和 message */
function apiError(status: number, code: string, message = "调试描述") {
  return HttpResponse.json(
    { statusCode: status, code, message, path: "/auth/login", timestamp: "" },
    { status },
  );
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Login />
    </QueryClientProvider>,
  );
}

const emailInput = () => screen.getByLabelText(/^form\.email/);
const passwordInput = () => screen.getByLabelText(/^form\.password/);
const submitButton = () =>
  // 提交中按钮里会多一个 Spinner（aria-label="Loading"），所以用正则匹配
  screen.getByRole("button", { name: /form\.loginSubmit/ });

async function fillAndSubmit(
  email = "test@example.com",
  password = "secret123",
) {
  const user = userEvent.setup();
  await user.type(emailInput(), email);
  await user.type(passwordInput(), password);
  await user.click(submitButton());
  return user;
}

beforeEach(() => {
  window.history.pushState({}, "", "/login");
  useAuthStore.setState({ user: null });
  replaceMock.mockClear();
  toastInfoMock.mockClear();
});

describe("登录页", () => {
  it("空表单提交时提示必填项，且不请求后端", async () => {
    const loginSpy = vi.fn();
    server.use(
      http.post("/api/auth/login", () => {
        loginSpy();
        return HttpResponse.json({ user: mockUser });
      }),
    );

    renderPage();
    await userEvent.setup().click(submitButton());

    expect(await screen.findByText("validation.email")).toBeInTheDocument();
    expect(screen.getByText("validation.password")).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("邮箱格式不合法时提交被拦下", async () => {
    const loginSpy = vi.fn();
    server.use(
      http.post("/api/auth/login", () => {
        loginSpy();
        return HttpResponse.json({ user: mockUser });
      }),
    );

    renderPage();
    await fillAndSubmit("not-an-email");

    expect(await screen.findByText("validation.email")).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("登录成功后写入用户并跳转", async () => {
    let body: unknown;
    server.use(
      http.post("/api/auth/login", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: mockUser });
      }),
    );

    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
    expect(body).toEqual({
      email: "test@example.com",
      password: "secret123",
      rememberMe: false,
    });
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("带 redirect 参数时跳回原地址，并提示会话已失效", async () => {
    window.history.pushState({}, "", "/login?redirect=%2Fhealth");
    server.use(
      http.post("/api/auth/login", () => HttpResponse.json({ user: mockUser })),
    );

    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/health"));
    expect(toastInfoMock).toHaveBeenCalledWith(
      "AUTH_UNAUTHORIZED",
      expect.objectContaining({ id: "session-expired" }),
    );
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
  ])("redirect 是站外地址时不跳转：%s", async (target) => {
    window.history.pushState(
      {},
      "",
      `/login?redirect=${encodeURIComponent(target)}`,
    );
    server.use(
      http.post("/api/auth/login", () => HttpResponse.json({ user: mockUser })),
    );

    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
  });

  it("登录失败时在提示条里展示后端错误码", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        apiError(401, "AUTH_INVALID_CREDENTIALS"),
      ),
    );

    renderPage();
    await fillAndSubmit("test@example.com", "wrong-password");

    expect(
      await screen.findByText("AUTH_INVALID_CREDENTIALS"),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("点击眼睛按钮切换密码明文", async () => {
    renderPage();

    expect(passwordInput()).toHaveAttribute("type", "password");

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "form.showPassword" }));

    expect(passwordInput()).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "form.hidePassword" }),
    ).toBeInTheDocument();
  });

  it("提交过程中禁用输入与按钮，避免重复提交", async () => {
    // 永不 resolve 的 handler：请求一直挂起，能稳定观察到 pending 态
    server.use(
      http.post("/api/auth/login", () => new Promise<never>(() => {})),
    );

    renderPage();
    await fillAndSubmit();

    await waitFor(() => expect(submitButton()).toBeDisabled());
    expect(emailInput()).toBeDisabled();
    expect(passwordInput()).toBeDisabled();
  });
});
