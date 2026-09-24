import { Test, TestingModule } from "@nestjs/testing";
import { ErrorCode } from "../common/errors/error-code";
import { AppException } from "../common/exceptions/app.exception";
import { UserStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateFocusDto } from "./dto/update-focus.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { MemberService } from "./member.service";

describe("MemberService", () => {
  let service: MemberService;

  const prismaMock = {
    teamMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  /** 完整的 Prisma User 行：toUser 会读 Date 字段，mock 不能缺 */
  function userRow(overrides: Record<string, unknown> = {}) {
    return {
      id: "u1",
      name: "测试用户",
      email: "u1@test.com",
      passwordHash: "hashed-not-plain",
      avatarUrl: null,
      timezone: "Asia/Tokyo",
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
      status: UserStatus.OFFLINE,
      focus: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      ...overrides,
    };
  }

  function memberRow(overrides: Record<string, unknown> = {}) {
    return {
      id: "tm1",
      teamId: "t1",
      userId: "u1",
      role: "MEMBER",
      joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      ...overrides,
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("list", () => {
    it("不传 teamId 时取最早加入的团队", async () => {
      prismaMock.teamMember.findFirst.mockResolvedValue(memberRow());
      prismaMock.teamMember.findMany.mockResolvedValue([
        { ...memberRow(), user: userRow() },
        {
          ...memberRow({ id: "tm2", userId: "u2" }),
          user: userRow({ id: "u2", email: "u2@test.com" }),
        },
      ]);

      const result = await service.list("u1");

      expect(prismaMock.teamMember.findFirst).toHaveBeenCalledWith({
        where: { userId: "u1" },
        // 第二排序键不能少：seed 批量插入时 joinedAt 会撞在同一毫秒
        orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
      });
      expect(prismaMock.teamMember.findMany).toHaveBeenCalledWith({
        where: { teamId: "t1" },
        include: { user: true },
        // Prisma 多字段排序必须用数组，对象形式会校验失败
        orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
      });
      // findFirst 命中本身已证明是成员，不该再多查一次
      expect(prismaMock.teamMember.findUnique).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it("映射结果不含 passwordHash，并带上 role 等成员字段", async () => {
      prismaMock.teamMember.findFirst.mockResolvedValue(
        memberRow({ role: "OWNER" }),
      );
      prismaMock.teamMember.findMany.mockResolvedValue([
        { ...memberRow({ role: "OWNER" }), user: userRow() },
      ]);

      const [member] = await service.list("u1");

      expect(member).not.toHaveProperty("passwordHash");
      expect(member).toMatchObject({
        // 契约里 id 取的是 user.id，前端用它当渲染 key
        id: "u1",
        role: "OWNER",
        teamId: "t1",
        userId: "u1",
        joinedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("不属于任何团队时返回空数组，不查成员列表", async () => {
      prismaMock.teamMember.findFirst.mockResolvedValue(null);

      const result = await service.list("u1");

      expect(result).toEqual([]);
      expect(prismaMock.teamMember.findMany).not.toHaveBeenCalled();
    });

    it("传了 teamId 但当前用户不在该团队：403 且不返回成员", async () => {
      prismaMock.teamMember.findUnique.mockResolvedValue(null);

      const listPromise = service.list("u1", "t-other");

      await expect(listPromise).rejects.toBeInstanceOf(AppException);
      await expect(listPromise).rejects.toMatchObject({
        code: ErrorCode.TEAM_ACCESS_DENIED,
      });
      expect(prismaMock.teamMember.findMany).not.toHaveBeenCalled();
      expect(prismaMock.teamMember.findFirst).not.toHaveBeenCalled();
    });

    it("传了 teamId 且是成员：正常返回", async () => {
      prismaMock.teamMember.findUnique.mockResolvedValue(memberRow());
      prismaMock.teamMember.findMany.mockResolvedValue([
        { ...memberRow(), user: userRow() },
      ]);

      const result = await service.list("u1", "t1");

      expect(result).toHaveLength(1);
      expect(prismaMock.teamMember.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("updateStatus", () => {
    it("只按 JWT 里的 userId 更新，返回不含 passwordHash", async () => {
      prismaMock.user.update.mockResolvedValue(
        userRow({ status: UserStatus.BUSY }),
      );
      const dto: UpdateStatusDto = { status: UserStatus.BUSY };

      const result = await service.updateStatus("u1", dto);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { status: UserStatus.BUSY },
      });
      expect(result.status).toBe(UserStatus.BUSY);
      expect(result).not.toHaveProperty("passwordHash");
    });
  });

  describe("updateFocus", () => {
    it("传 null 表示清空焦点", async () => {
      prismaMock.user.update.mockResolvedValue(userRow({ focus: null }));
      const dto: UpdateFocusDto = { focus: null };

      const result = await service.updateFocus("u1", dto);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { focus: null },
      });
      expect(result.focus).toBeNull();
    });

    it("传字符串表示设置焦点", async () => {
      prismaMock.user.update.mockResolvedValue(
        userRow({ focus: "写阶段二测试" }),
      );

      const result = await service.updateFocus("u1", { focus: "写阶段二测试" });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { focus: "写阶段二测试" },
      });
      expect(result.focus).toBe("写阶段二测试");
    });
  });
});
