import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserInput } from "./dto/register.dto";

@Injectable()
export class UserService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * 创建用户
	 * @param user 用户
	 * @returns 创建的用户
	 */
	async create(user: CreateUserInput) {
		return this.prisma.user.create({
			data: {
				name: user.name,
				email: user.email,
				passwordHash: user.passwordHash,
			},
		});
	}

	/**
	 * 根据邮箱查询用户
	 * @param email 用户邮箱
	 * @returns 用户
	 */
	async findByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: {
				email,
			},
		});
	}
}
