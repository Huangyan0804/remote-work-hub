import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("注册接口", async () => {
    const registerDto = {
      name: "test",
      email: "test@example.com",
      password: "12345678",
    };
    authServiceMock.register.mockResolvedValue({
      user: {
        id: 1,
        name: "test",
        email: "test@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
      },
      token: "fake-token",
    });
    const res = await controller.register(registerDto);
    expect(res).toBeDefined();
    expect(res.user).toMatchObject({
      id: 1,
      name: "test",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.jpg",
    });
    expect(res.token).toBe("fake-token");
  });

  it("login接口", async () => {
    const loginDto = {
      email: "test@example.com",
      password: "12345678",
    };
    authServiceMock.login.mockResolvedValue({
      token: "fake-token",
      user: {
        id: 1,
        name: "test",
        email: "test@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
      },
    });
    const res = await controller.login(loginDto);
    expect(res).toBeDefined();
    expect(res.token).toBe("fake-token");
  });

  it("me接口", async () => {
    authServiceMock.getProfile.mockResolvedValue({
      id: 1,
      name: "test",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const res = await controller.me({
      sub: "1",
      email: "test@example.com",
    });
    expect(res).toBeDefined();
    expect(res.email).toBe("test@example.com");
  });
});
