import { ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { SKIP_AUTH_KEY } from "../common/decorators/skip-auth.decorator";
import { ErrorCode } from "../common/errors/error-code";
import { AppException } from "../common/exceptions/app.exception";
import type { JwtPayload } from "./interfaces/jwt-payload.interface";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const skipAuth = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipAuth) {
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }

  // 覆写默认实现：passport 失败时抛的是没有 code 的 UnauthorizedException，
  // 换成 AppException 后 401 也带错误码，前端才能和其他错误统一处理。
  // 注意 err 不为空时要原样上抛（策略内部异常），别一律伪装成 401。
  handleRequest<TUser = JwtPayload>(err: unknown, user: TUser | false): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      throw new AppException(
        ErrorCode.AUTH_UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
