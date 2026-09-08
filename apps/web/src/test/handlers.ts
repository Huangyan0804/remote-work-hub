import { http, HttpResponse } from "msw";

// 声明"这个接口正常时该返回什么"。路径要和 api-client 真实请求一致：
// baseURL http://localhost:3001/api + "/health"
export const handlers = [
  http.get("http://localhost:3001/api/health", () =>
    HttpResponse.json({ status: "ok", db: "connected", userCount: 3 }),
  ),
];