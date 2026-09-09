import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
	let service: AuthService;
	const userServiceMock = {
		findByEmail: jest.fn().mockResolvedValue({ id: 1 }),
		create: jest.fn().mockResolvedValue({ id: 1 }),
	};
	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthService, { provide: UserService, useValue: userServiceMock }, JwtService],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
