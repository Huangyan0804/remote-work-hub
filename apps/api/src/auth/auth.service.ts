import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthResponse, User } from "@repo/types";
import bcrypt from "bcrypt";
import { ErrorCode } from "../common/errors/error-code";
import { AppException } from "../common/exceptions/app.exception";
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
      throw new AppException(
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
        HttpStatus.CONFLICT,
      );
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
          // 先查后建仍有并发竞态：同邮箱同时注册会撞唯一索引，兜成同一个业务错误
          throw new AppException(
            ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
            HttpStatus.CONFLICT,
          );
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
    // 用户不存在与密码错误刻意用同一个错误码，不暴露"该邮箱是否已注册"
    if (!user) {
      throw new AppException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new AppException(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
      );
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
      throw new AppException(
        ErrorCode.AUTH_USER_NOT_FOUND,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return toUser(user);
  }
}
