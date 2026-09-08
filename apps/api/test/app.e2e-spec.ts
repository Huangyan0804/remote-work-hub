import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

describe("AppController (e2e)", () => {
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

  it("GET /api/health 真实查库并返回 ok", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/health")
      .expect(200);

    expect(res.body).toMatchObject({ status: "ok", db: "connected" });
    expect(res.body.userCount).toEqual(0);
    expect(typeof res.body.userCount).toBe("number");
  });
});
