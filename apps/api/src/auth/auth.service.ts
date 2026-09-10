import { ConflictException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { Prisma } from "../generated/prisma/client";
import { toAuthUser } from "../user/user.mapper";
import { UserService } from "../user/user.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // 检查邮箱是否存在
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("邮箱已存在");
    }

    const user = await this.userService
      .create({
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: await bcrypt.hash(registerDto.password, this.saltRounds),
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ConflictException("邮箱已存在");
        }
        throw error; // 数据库挂了、字段超长等，原样往上抛，别伪装成 409
      });

    const payload = {
      sub: user.id,
      email: user.email,
    };
    const token = await this.jwtService.signAsync(payload);
    return { user: toAuthUser(user), token };
  }
}
