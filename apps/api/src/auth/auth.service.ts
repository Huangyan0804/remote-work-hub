import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TokenResponse, User } from "@repo/types";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { ErrorCode } from "../common/errors/error-code";
import { AppException } from "../common/exceptions/app.exception";
import { JwtPayload } from "../common/interface/jwt-payload.interface";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { toAuthUser, toUser } from "../user/user.mapper";
import { UserService } from "../user/user.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { generateRefreshToken, hashRefreshToken } from "./refresh-token.util";

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponse> {
    // 检查邮箱是否存在
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new AppException(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
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
          throw new AppException(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
        }
        throw error; // 数据库挂了、字段超长等，原样往上抛，别伪装成 409
      });
    const tokens = await this.issueTokens(toUser(user), true);
    return { user: toAuthUser(user), ...tokens };
  }

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const user = await this.userService.findByEmail(loginDto.email);
    // 用户不存在与密码错误刻意用同一个错误码，不暴露"该邮箱是否已注册"
    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.passwordHash))
    ) {
      throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }
    const tokens = await this.issueTokens(
      toUser(user),
      loginDto.rememberMe ?? false,
    );
    return { user: toAuthUser(user), ...tokens };
  }

  async getProfile(id: string): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new AppException(ErrorCode.AUTH_UNAUTHORIZED);
    }
    return toUser(user);
  }

  private async issueTokens(user: User, rememberMe: boolean) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    } satisfies JwtPayload);

    const refreshToken = generateRefreshToken();
    const days = rememberMe
      ? this.configService.get<number>("JWT_REFRESH_DAYS", 30)
      : this.configService.get<number>("JWT_REFRESH_SESSION_DAYS", 1);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: hashRefreshToken(refreshToken),
        familyId: randomUUID(),
        userId: user.id,
        expiresAt,
      },
    });
    return {
      accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt.toISOString(),
    };
  }

  async refresh(rawToken: string): Promise<TokenResponse> {
    const record = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
    if (!record) {
      throw new AppException(ErrorCode.AUTH_UNAUTHORIZED);
    }
    if (record.revokedAt || record.expiresAt < new Date()) {
      await this.prismaService.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppException(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const user = await this.userService.findById(record.userId);
    if (!user) {
      throw new AppException(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    } satisfies JwtPayload);

    // 轮换：吊销旧的，在同一 family 下发新的
    // 注意继承原 expiresAt，不继承的话 refresh token 会永不过期
    const newRefreshToken = generateRefreshToken();

    await this.prismaService.$transaction([
      this.prismaService.refreshToken.update({
        where: { id: record.id },
        data: { revokedAt: new Date() },
      }),
      this.prismaService.refreshToken.create({
        data: {
          tokenHash: hashRefreshToken(newRefreshToken),
          familyId: record.familyId,
          userId: record.userId,
          expiresAt: record.expiresAt,
        },
      }),
    ]);
    return {
      user: toAuthUser(user),
      accessToken,
      refreshToken: newRefreshToken,
      refreshExpiresAt: record.expiresAt.toISOString(),
    };
  }

  async logout(rawToken: string): Promise<void> {
    const record = await this.prismaService.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
    if (!record) return; // 幂等：找不到也算成功

    await this.prismaService.refreshToken.updateMany({
      where: { familyId: record.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
