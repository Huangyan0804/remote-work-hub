import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthResponse, User } from "@repo/types";
import bcrypt from "bcrypt";
import { Prisma } from "../generated/prisma/client";
import { toAuthUser, toUser } from "../user/user.mapper";
import { UserService } from "../user/user.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
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

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const token = await this.jwtService.signAsync(payload);
    return { user: toAuthUser(user), token };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException("邮箱或密码错误");
    }
    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException("邮箱或密码错误");
    }
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const token = await this.jwtService.signAsync(payload);
    return { user: toAuthUser(user), token };
  }

  async getProfile(id: string): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new UnauthorizedException("用户不存在");
    }
    return toUser(user);
  }
}
