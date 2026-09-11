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

    expect(res.body.token).toEqual(expect.any(String));
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
    expect(loginRes.body.token).toEqual(expect.any(String));

    const meRes = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`)
      .expect(200);
    expect(meRes.body.email).toEqual(userInfo.email);
  });

  it("注册到登录失败返回401", async () => {
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
      .expect(401);
    expect(unknownEmailRes.body.code).toBe("AUTH_INVALID_CREDENTIALS");

    const wrongPasswordRes = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: userInfo.email, password: "wrong_password" })
      .expect(401);
    expect(wrongPasswordRes.body.code).toBe("AUTH_INVALID_CREDENTIALS");
  });
});
