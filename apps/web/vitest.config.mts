import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false, // 强制显式 import，类型更清晰
    setupFiles: ["./src/test/setup.ts"],
    // 单测只扫 src/，避免把 e2e/*.spec.ts（Playwright）误当 vitest 用例
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    css: false,
  },
  resolve: {
    // 复刻 tsconfig 的 @/* 别名，否则组件里的 import "@/..." 解析不了
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
