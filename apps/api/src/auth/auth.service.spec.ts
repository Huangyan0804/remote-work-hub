import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import bcrypt from "bcrypt";
import { ErrorCode } from "../common/errors/error-code";
import { AppException } from "../common/exceptions/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";
import { hashRefreshToken } from "./refresh-token.util";

describe("AuthService", () => {
  let service: AuthService;
  const userServiceMock = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };
  const prismaMock = {
    user: {
      count: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };
  const configMock = {
    getOrThrow: jest.fn(),
    get: jest.fn(),
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    // 轮换是包在 $transaction 里执行的，默认让它成功；个别用例再覆盖
    prismaMock.$transaction.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("注册成功", async () => {
    const registerDto = {
      name: "test",
      email: "test@example.com",
      password: "12345678",
    };
    userServiceMock.findByEmail.mockResolvedValue(null);
    userServiceMock.create.mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      passwordHash: "hashed-not-plain",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtServiceMock.signAsync.mockResolvedValue("fake-token");
    configMock.get.mockReturnValue(30);

    const result = await service.register(registerDto);
    expect(result).toBeDefined();
    expect(result.accessToken).toBe("fake-token");
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("createdAt");
    expect(result.user).not.toHaveProperty("updatedAt");

    const created = userServiceMock.create.mock.calls[0][0];
    expect(created.passwordHash).not.toBe(registerDto.password);
  });

  it("邮箱已存在", async () => {
    userServiceMock.findByEmail.mockResolvedValue({
      id: "u1",
    });
    const registerPromise = service.register({
      name: "test",
      email: "test@example.com",
      password: "12345678",
    });
    await expect(registerPromise).rejects.toBeInstanceOf(AppException);
    await expect(registerPromise).rejects.toMatchObject({
      code: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
    });
    expect(userServiceMock.create).not.toHaveBeenCalled();
  });

  it("登录成功", async () => {
    const loginDto = {
      email: "test@example.com",
      password: "12345678",
    };
    const hashedPassword = await bcrypt.hash(loginDto.password, 10);
    userServiceMock.findByEmail.mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtServiceMock.signAsync.mockResolvedValue("fake-token");
    configMock.get.mockReturnValue(30);

    const result = await service.login(loginDto);
    expect(result).toBeDefined();
    expect(result.accessToken).toBe("fake-token");
    expect(result.user.email).toBe(loginDto.email);
  });

  it("登录用户不存在", async () => {
    const loginDto = {
      email: "test@example.com",
      password: "12345678",
    };
    userServiceMock.findByEmail.mockResolvedValue(null);
    jwtServiceMock.signAsync.mockResolvedValue("fake-token");
    await expect(service.login(loginDto)).rejects.toMatchObject({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });

  it("登录密码错误", async () => {
    const loginDto = {
      email: "test@example.com",
      password: "12345678",
    };
    const hashedPassword = await bcrypt.hash("wrong_password", 10);
    userServiceMock.findByEmail.mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      passwordHash: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtServiceMock.signAsync.mockResolvedValue("fake-token");
    await expect(service.login(loginDto)).rejects.toMatchObject({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    });
  });

  describe("refresh 轮换与重放检测", () => {
    const userRow = {
      id: "u1",
      name: "test",
      email: "test@example.com",
      avatarUrl: null,
      timezone: "Asia/Tokyo",
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
      status: "OFFLINE",
      focus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /** 一条"仍然有效"的 refresh token 记录 */
    function activeToken() {
      return {
        id: "rt1",
        tokenHash: "hashed-old-token",
        familyId: "family-1",
        userId: "u1",
        revokedAt: null as Date | null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };
    }

    it("成功轮换：吊销旧记录，并在同一 family 下发新 token", async () => {
      const record = activeToken();
      prismaMock.refreshToken.findUnique.mockResolvedValue(record);
      userServiceMock.findById.mockResolvedValue(userRow);
      jwtServiceMock.signAsync.mockResolvedValue("new-access-token");

      const result = await service.refresh("raw-old-token");

      expect(result.accessToken).toBe("new-access-token");
      expect(result.user.id).toBe("u1");
      expect(result.refreshToken).not.toBe("raw-old-token");

      // 旧记录被标记吊销，而不是删除
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: { id: "rt1" },
        data: { revokedAt: expect.any(Date) },
      });

      const created = prismaMock.refreshToken.create.mock.calls[0][0];
      // 落库的是哈希，不是明文
      expect(created.data.tokenHash).toBe(
        hashRefreshToken(result.refreshToken),
      );
      // 同 family 才能被重放检测一锅端
      expect(created.data.familyId).toBe("family-1");
      // 继承原过期时间：不继承的话每轮一次刷新 token 就永不过期
      expect(created.data.expiresAt).toEqual(record.expiresAt);
      expect(result.refreshExpiresAt).toBe(record.expiresAt.toISOString());
    });

    it("重放已吊销的 token：整族吊销", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...activeToken(),
        revokedAt: new Date(),
      });

      await expect(service.refresh("replayed-token")).rejects.toMatchObject({
        code: ErrorCode.AUTH_UNAUTHORIZED,
      });

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: "family-1", revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
    });

    it("已过期的 token：整族吊销", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...activeToken(),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.refresh("expired-token")).rejects.toMatchObject({
        code: ErrorCode.AUTH_UNAUTHORIZED,
      });

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
    });

    it("token 不存在：401 且不写库", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh("unknown-token")).rejects.toMatchObject({
        code: ErrorCode.AUTH_UNAUTHORIZED,
      });

      expect(prismaMock.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
    });

    it("用户已被删除：401 且不发放新 token", async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(activeToken());
      userServiceMock.findById.mockResolvedValue(null);

      await expect(service.refresh("raw-old-token")).rejects.toMatchObject({
        code: ErrorCode.AUTH_UNAUTHORIZED,
      });

      expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
    });
  });
});
