import { ConflictException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { UserService } from "../user/user.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
	) {}
	saltRounds = 10;

	async register(registerDto: RegisterDto) {
		// 检查邮箱是否存在
		const existingUser = await this.userService.findByEmail(registerDto.email);
		if (existingUser) {
			throw new ConflictException("邮箱已存在");
		}

		const user = await this.userService.create({
			name: registerDto.name,
			email: registerDto.email,
			passwordHash: await bcrypt.hash(registerDto.password, this.saltRounds),
		});
		const { passwordHash, ...safeUser } = user;
		const payload = {
			sub: safeUser.id,
			email: safeUser.email,
		};
		const token = await this.jwtService.signAsync(payload);
		return { user: safeUser, token };
	}
}
