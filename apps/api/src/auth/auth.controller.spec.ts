import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
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

  it("should call register service", async () => {
    const registerDto = {
      name: "test",
      email: "test@example.com",
      password: "12345678",
    };
    const now = new Date();
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
});
