import { HttpResponse, http } from "msw";

// 声明"这个接口正常时该返回什么"。路径要和 api-client 真实请求一致：
// 走 BFF 后 baseURL 是同源 "/api"，因此这里用相对路径（按 jsdom 的 origin 解析）。
export const handlers = [
  http.get("/api/health", () =>
    HttpResponse.json({ status: "ok", db: "connected", userCount: 3 }),
  ),
];
