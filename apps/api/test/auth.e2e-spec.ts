import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // 复用生产配置，保证 /api 前缀生效
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("register 成功返回 token 且无 passwordHash", async () => {
    const name = Date.now();
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        name: `test${name}`,
        email: `test${name}@test.com`,
        password: "12345678",
      })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });
  it("重复邮箱返回409", async () => {
    const email = `dup${Date.now()}@test.com`;
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Alice", email, password: "password123" })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "Bob", email, password: "password123" })
      .expect(409);
    // 断言错误码契约（字面量），防止重构时悄悄改了对外契约
    expect(res.body.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");
  });

  it("非法 payload 返回 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ name: "", email: "bad", password: "1" })
      .expect(400);
    expect(res.body.code).toBe("COMMON_VALIDATION_FAILED");
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "email" })]),
    );
  });

  it("未登录获取me失败返回401", async () => {
    const noTokenRes = await request(app.getHttpServer())
      .get("/api/auth/me")
      .expect(401);
    expect(noTokenRes.body.code).toBe("AUTH_UNAUTHORIZED");

    const badTokenRes = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer bad_token`)
      .expect(401);
    expect(badTokenRes.body.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("注册到登录到获取me成功", async () => {
    const name = Date.now();
    const userInfo = {
      name: `test${name}`,
      email: `test${name}@test.com`,
      password: "12345678",
    };
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        name: userInfo.name,
        email: userInfo.email,
        password: userInfo.password,
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: userInfo.email, password: userInfo.password })
      .expect(200);
    expect(loginRes.body.accessToken).toEqual(expect.any(String));

    const meRes = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
    expect(meRes.body.email).toEqual(userInfo.email);
  });

  it("注册到登录失败返回400", async () => {
    const name = Date.now();
    const userInfo = {
      name: `test${name}`,
      email: `test${name}@test.com`,
      password: "12345678",
    };
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        name: userInfo.name,
        email: userInfo.email,
        password: userInfo.password,
      })
      .expect(201);

    const unknownEmailRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "bad_email@test.com", password: "wrong_password" })
      .expect(400);
    expect(unknownEmailRes.body.code).toBe("AUTH_INVALID_CREDENTIALS");

    const wrongPasswordRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: userInfo.email, password: "wrong_password" })
      .expect(400);
    expect(wrongPasswordRes.body.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  // 每个用例自带独立账号，避免 refresh token 互相影响
  async function registerOnce() {
    const name = Date.now();
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({
        name: `r${name}`,
        email: `refresh${name}@test.com`,
        password: "12345678",
      })
      .expect(201);
    return res.body as {
      accessToken: string;
      refreshToken: string;
      refreshExpiresAt: string;
      user: { id: string; email: string };
    };
  }

  it("refresh 轮换：旧 token 失效，新 token 可用且不续命", async () => {
    const registered = await registerOnce();

    const refreshed = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: registered.refreshToken })
      .expect(200);

    expect(refreshed.body.refreshToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).not.toBe(registered.refreshToken);
    // 轮换不能延长有效期，否则 refresh token 等于永不过期
    expect(refreshed.body.refreshExpiresAt).toBe(registered.refreshExpiresAt);

    // 新 access token 立刻能用
    const meRes = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${refreshed.body.accessToken}`)
      .expect(200);
    expect(meRes.body.id).toBe(registered.user.id);
  });

  it("重放旧 refresh token：返回 401 并连带吊销整族", async () => {
    const registered = await registerOnce();

    const refreshed = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: registered.refreshToken })
      .expect(200);

    // 旧 token 已吊销，再用一次就是重放
    const replayed = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: registered.refreshToken })
      .expect(401);
    expect(replayed.body.code).toBe("AUTH_UNAUTHORIZED");

    // 重放意味着 token 可能已泄漏 → 同族全部作废，刚换到的新 token 也不能用了
    const afterReplay = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
    expect(afterReplay.body.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("logout 后再拿 refresh token 换新会被拒", async () => {
    const registered = await registerOnce();

    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .send({ refreshToken: registered.refreshToken })
      .expect(204);

    const res = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: registered.refreshToken })
      .expect(401);
    expect(res.body.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("refresh token 不存在或为空时返回 401 / 400", async () => {
    const notFoundRes = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: "not-a-real-token" })
      .expect(401);
    expect(notFoundRes.body.code).toBe("AUTH_UNAUTHORIZED");

    const emptyRes = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .send({ refreshToken: "" })
      .expect(400);
    expect(emptyRes.body.code).toBe("COMMON_VALIDATION_FAILED");
  });
});
