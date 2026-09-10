import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

// MSW 生命周期：套件开始前起服务、每例后复位 handler、全结束关掉
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup(); // 卸载组件 DOM
});
afterAll(() => server.close());
