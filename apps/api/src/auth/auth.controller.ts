import { Body, Controller, Post } from "@nestjs/common";
import { AuthResponse } from "@repo/types";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
		const { user, token } = await this.authService.register(registerDto);
		return {
			user: {
				...user,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			},
			token,
		};
	}
}
