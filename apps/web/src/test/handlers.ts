import { HttpResponse, http } from "msw";

// 声明"这个接口正常时该返回什么"。路径要和 api-client 真实请求一致：
// 走 BFF 后 baseURL 是同源 "/api"，因此这里用相对路径（按 jsdom 的 origin 解析）。
// 单个用例要模拟失败时，用 server.use() 在本例内覆盖即可。
export const mockUser = {
  id: "u_1",
  name: "测试用户",
  email: "test@example.com",
  avatarUrl: null,
};

export const handlers = [
  http.get("/api/health", () =>
    HttpResponse.json({ status: "ok", db: "connected", userCount: 3 }),
  ),
  // 登录/注册成功都只回 { user }：token 放在 BFF 写的 httpOnly cookie 里，前端拿不到也不需要
  http.post("/api/auth/login", () => HttpResponse.json({ user: mockUser })),
  http.post("/api/auth/register", () =>
    HttpResponse.json({ user: mockUser }, { status: 201 }),
  ),
];
