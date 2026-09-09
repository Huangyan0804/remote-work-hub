import { ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
	let service: AuthService;
	const userServiceMock = {
		findByEmail: jest.fn(),
		create: jest.fn(),
	};
	const jwtServiceMock = {
		signAsync: jest.fn(),
	};
	beforeEach(async () => {
		jest.clearAllMocks();
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UserService, useValue: userServiceMock },
				{ provide: JwtService, useValue: jwtServiceMock },
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
		});
		jwtServiceMock.signAsync.mockResolvedValue("fake-token");

		const result = await service.register(registerDto);
		expect(result).toBeDefined();
		expect(result.token).toBe("fake-token");
		expect(result.user).not.toHaveProperty("passwordHash");

		const created = userServiceMock.create.mock.calls[0][0];
		expect(created.passwordHash).not.toBe(registerDto.password);
	});

	it("邮箱已存在", async () => {
		userServiceMock.findByEmail.mockResolvedValue({
			id: "u1",
		});
		await expect(
			service.register({
				name: "test",
				email: "test@example.com",
				password: "12345678",
			}),
		).rejects.toBeInstanceOf(ConflictException);
		expect(userServiceMock.create).not.toHaveBeenCalled();
	});
});
