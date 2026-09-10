import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import Home from "./page";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>,
  );
}

describe("健康检查页", () => {
  it("加载成功后展示 status / db / 用户数", async () => {
    renderPage();

    // 初始是 pending：loading 徽标可见
    expect(screen.getByText("正在检查…")).toBeInTheDocument();

    // MSW 的响应是异步的 → 用 findBy（自动等待）
    expect(await screen.findByText(/status: ok/)).toBeInTheDocument();
    expect(screen.getByText(/db: connected/)).toBeInTheDocument();
    expect(screen.getByText(/当前用户数：3/)).toBeInTheDocument();
  });

  it("点击重新检查会再次请求后端", async () => {
    const fetchSpy = vi.fn();
    server.use(
      // 本用例单独覆盖 handler：记录调用次数，返回不同数据证明刷新生效
      http.get("http://localhost:3001/api/health", () => {
        fetchSpy();
        return HttpResponse.json({
          status: "ok",
          db: "connected",
          userCount: 5,
        });
      }),
    );

    renderPage();
    await screen.findByText(/当前用户数：5/);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "重新检查" }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2)); // 挂载 1 次 + 点击 1 次
  });

  it("请求失败时展示连接失败与提示", async () => {
    server.use(
      http.get("http://localhost:3001/api/health", () => HttpResponse.error()),
    );

    renderPage();
    expect(await screen.findByText("连接失败")).toBeInTheDocument();
    expect(
      screen.getByText(/请确认数据库与 API 服务已启动/),
    ).toBeInTheDocument();
  });
});
