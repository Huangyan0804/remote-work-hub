import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false, // 强制显式 import，类型更清晰
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
  resolve: {
    // 复刻 tsconfig 的 @/* 别名，否则组件里的 import "@/..." 解析不了
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});