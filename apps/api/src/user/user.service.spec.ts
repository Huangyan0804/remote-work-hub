import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { UserService } from "./user.service";

describe("UserService", () => {
	let service: UserService;
	const prismaMock = {
		user: {
			count: jest.fn().mockResolvedValue(3),
			create: jest.fn().mockResolvedValue({ id: 1 }),
		},
	};
	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [UserService, { provide: PrismaService, useValue: prismaMock }],
		}).compile();

		service = module.get<UserService>(UserService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
