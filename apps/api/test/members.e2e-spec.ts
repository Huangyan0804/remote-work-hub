import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { TeamRole, UserStatus } from "../src/generated/prisma/client";
import { PrismaService } from "../src/prisma/prisma.service";

describe("MemberController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // 复用生产配置，保证 /api 前缀与 ValidationPipe 生效
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  /** 注册一个独立账号，避免用例之间互相影响 */
  async function registerOnce() {
    const uniq = `${Date.now()}-${Math.random().toString(36)}`;
    const email = `member-${uniq}@test.com`;
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      // name 有 @MaxLength(20)，别把 uniq 拼进去
      .send({ name: `m${Date.now()}`, email, password: "12345678" })
      .expect(201);
    return {
      accessToken: res.body.accessToken as string,
      userId: res.body.user.id as string,
      email,
    };
  }

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * 建团队并把人拉进去（第一个是 OWNER）。
   * 测试库不跑 seed，成员关系只能在这里现造。
   */
  async function createTeamWith(userIds: string[]) {
    const team = await prisma.team.create({
      data: {
        name: `e2e-team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    });
    for (const [index, userId] of userIds.entries()) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: index === 0 ? TeamRole.OWNER : TeamRole.MEMBER,
        },
      });
    }
    return team;
  }

  it("未鉴权访问成员列表返回 401", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/members")
      .expect(401);
    expect(res.body.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("不属于任何团队的账号：返回空列表而不是报错", async () => {
    const { accessToken } = await registerOnce();

    const res = await request(app.getHttpServer())
      .get("/api/members")
      .set(auth(accessToken))
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("团队成员列表：含同队成员与 role，且不泄漏 passwordHash", async () => {
    const owner = await registerOnce();
    const mate = await registerOnce();
    await createTeamWith([owner.userId, mate.userId]);

    const res = await request(app.getHttpServer())
      .get("/api/members")
      .set(auth(owner.accessToken))
      .expect(200);

    expect(res.body).toHaveLength(2);
    // 顺序由 joinedAt + id 决定，别用下标断言
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: owner.userId, role: "OWNER" }),
        expect.objectContaining({ userId: mate.userId, role: "MEMBER" }),
      ]),
    );
    for (const member of res.body) {
      expect(member).not.toHaveProperty("passwordHash");
      expect(member.email).toEqual(expect.any(String));
      expect(member.joinedAt).toEqual(expect.any(String));
      expect(member.teamId).toEqual(expect.any(String));
    }
  });

  it("传了非本人所属的 teamId：403 TEAM_ACCESS_DENIED", async () => {
    const outsider = await registerOnce();
    const otherTeam = await createTeamWith([outsider.userId]);

    const { accessToken } = await registerOnce();
    const res = await request(app.getHttpServer())
      .get(`/api/members?teamId=${otherTeam.id}`)
      .set(auth(accessToken))
      .expect(403);

    expect(res.body.code).toBe("TEAM_ACCESS_DENIED");
  });

  it("PATCH status：返回更新后的 User，再次查询已持久化", async () => {
    const owner = await registerOnce();
    await createTeamWith([owner.userId]);

    const patched = await request(app.getHttpServer())
      .patch("/api/members/status")
      .set(auth(owner.accessToken))
      .send({ status: UserStatus.BUSY })
      .expect(200);

    expect(patched.body.id).toBe(owner.userId);
    expect(patched.body.status).toBe(UserStatus.BUSY);
    expect(patched.body).not.toHaveProperty("passwordHash");

    const list = await request(app.getHttpServer())
      .get("/api/members")
      .set(auth(owner.accessToken))
      .expect(200);
    const me = list.body.find(
      (member: { userId: string }) => member.userId === owner.userId,
    );
    expect(me.status).toBe(UserStatus.BUSY);
  });

  it("PATCH focus：能设置，也能传 null 清空", async () => {
    const owner = await registerOnce();
    await createTeamWith([owner.userId]);

    const set = await request(app.getHttpServer())
      .patch("/api/members/focus")
      .set(auth(owner.accessToken))
      .send({ focus: "阶段二联调" })
      .expect(200);
    expect(set.body.focus).toBe("阶段二联调");

    const cleared = await request(app.getHttpServer())
      .patch("/api/members/focus")
      .set(auth(owner.accessToken))
      .send({ focus: null })
      .expect(200);
    expect(cleared.body.focus).toBeNull();

    // 落库确认：focus 是全局字段，从 /me 也能读到
    const me = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set(auth(owner.accessToken))
      .expect(200);
    expect(me.body.focus).toBeNull();
  });

  it("body 里塞别人的 userId 也改不到别人", async () => {
    const victim = await registerOnce();
    await createTeamWith([victim.userId]);
    const attacker = await registerOnce();
    await createTeamWith([attacker.userId]);

    await request(app.getHttpServer())
      .patch("/api/members/status")
      .set(auth(attacker.accessToken))
      .send({ status: UserStatus.BUSY, userId: victim.userId })
      .expect(200);

    const victimMe = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set(auth(victim.accessToken))
      .expect(200);
    // 默认 OFFLINE，没被越权改动
    expect(victimMe.body.status).toBe(UserStatus.OFFLINE);

    const attackerMe = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set(auth(attacker.accessToken))
      .expect(200);
    expect(attackerMe.body.status).toBe(UserStatus.BUSY);
  });

  it("非法 status 或超长 focus 返回 400", async () => {
    const { accessToken } = await registerOnce();

    const badStatus = await request(app.getHttpServer())
      .patch("/api/members/status")
      .set(auth(accessToken))
      .send({ status: "NOT_A_STATUS" })
      .expect(400);
    expect(badStatus.body.code).toBe("COMMON_VALIDATION_FAILED");

    const longFocus = await request(app.getHttpServer())
      .patch("/api/members/focus")
      .set(auth(accessToken))
      .send({ focus: "x".repeat(256) })
      .expect(400);
    expect(longFocus.body.code).toBe("COMMON_VALIDATION_FAILED");
  });

  it("PATCH focus 完全不传字段：400（必须显式传值）", async () => {
    const { accessToken } = await registerOnce();

    const res = await request(app.getHttpServer())
      .patch("/api/members/focus")
      .set(auth(accessToken))
      .send({})
      .expect(400);

    expect(res.body.code).toBe("COMMON_VALIDATION_FAILED");
  });

  it("未鉴权 PATCH 返回 401", async () => {
    await request(app.getHttpServer())
      .patch("/api/members/status")
      .send({ status: UserStatus.BUSY })
      .expect(401);

    await request(app.getHttpServer())
      .patch("/api/members/focus")
      .send({ focus: "x" })
      .expect(401);
  });
});
