import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/lib/store";
import { mockUser } from "@/test/handlers";
import { server } from "@/test/server";
import Register from "./page";

// 同登录页：单测不加载 Next 运行时，t 回显 key
vi.mock("next-i18next/client", () => ({
  useT: () => ({ t: (key: string) => key }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), prefetch: vi.fn() }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Register />
    </QueryClientProvider>,
  );
}

const nameInput = () => screen.getByLabelText(/^form\.name/);
const emailInput = () => screen.getByLabelText(/^form\.email/);
const passwordInput = () => screen.getByLabelText(/^form\.password/);
const confirmInput = () => screen.getByLabelText(/^form\.confirmPassword/);
const policyCheckbox = () => screen.getByRole("checkbox");
const submitButton = () =>
  // 提交中按钮里会多一个 Spinner（aria-label="Loading"），所以用正则匹配
  screen.getByRole("button", { name: /form\.registerSubmit/ });

async function fillForm({
  name = "测试用户",
  email = "test@example.com",
  password = "secret123",
  confirmPassword = "secret123",
} = {}) {
  const user = userEvent.setup();
  if (name) await user.type(nameInput(), name);
  if (email) await user.type(emailInput(), email);
  if (password) await user.type(passwordInput(), password);
  if (confirmPassword) await user.type(confirmInput(), confirmPassword);
  return user;
}

beforeEach(() => {
  useAuthStore.setState({ user: null });
  replaceMock.mockClear();
});

describe("注册页", () => {
  it("空表单提交时逐项提示，且不请求后端", async () => {
    const registerSpy = vi.fn();
    server.use(
      http.post("/api/auth/register", () => {
        registerSpy();
        return HttpResponse.json({ user: mockUser }, { status: 201 });
      }),
    );

    renderPage();
    await userEvent.setup().click(submitButton());

    expect(await screen.findByText("validation.name")).toBeInTheDocument();
    expect(screen.getByText("validation.email")).toBeInTheDocument();
    expect(screen.getByText("validation.password")).toBeInTheDocument();
    expect(screen.getByText("validation.confirmPassword")).toBeInTheDocument();
    expect(screen.getByText("validation.policy")).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("两次密码不一致时提示密码不匹配", async () => {
    renderPage();
    await fillForm({ confirmPassword: "different1" });
    await userEvent.setup().click(submitButton());

    expect(
      await screen.findByText("validation.passwordMatch"),
    ).toBeInTheDocument();
  });

  it("密码长度不足时提示长度要求", async () => {
    renderPage();
    await fillForm({ password: "123", confirmPassword: "123" });
    await userEvent.setup().click(submitButton());

    expect(
      await screen.findByText("validation.passwordLength"),
    ).toBeInTheDocument();
  });

  it("未勾选服务条款时无法提交", async () => {
    const registerSpy = vi.fn();
    server.use(
      http.post("/api/auth/register", () => {
        registerSpy();
        return HttpResponse.json({ user: mockUser }, { status: 201 });
      }),
    );

    renderPage();
    await fillForm();
    await userEvent.setup().click(submitButton());

    expect(await screen.findByText("validation.policy")).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("注册成功后写入用户、跳首页，且只提交后端认识的字段", async () => {
    let body: unknown;
    server.use(
      http.post("/api/auth/register", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: mockUser }, { status: 201 });
      }),
    );

    renderPage();
    const user = await fillForm();
    await user.click(policyCheckbox());
    await user.click(submitButton());

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
    // confirmPassword / policy 只做前端校验，不该发给后端
    expect(body).toEqual({
      name: "测试用户",
      email: "test@example.com",
      password: "secret123",
    });
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("邮箱已被注册时在提示条里展示后端错误码", async () => {
    server.use(
      http.post("/api/auth/register", () =>
        HttpResponse.json(
          {
            statusCode: 409,
            code: "AUTH_EMAIL_ALREADY_EXISTS",
            message: "邮箱已被注册",
            path: "/auth/register",
            timestamp: "",
          },
          { status: 409 },
        ),
      ),
    );

    renderPage();
    const user = await fillForm();
    await user.click(policyCheckbox());
    await user.click(submitButton());

    expect(
      await screen.findByText("AUTH_EMAIL_ALREADY_EXISTS"),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("已有账号的链接指向登录页", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "form.toLogin" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
