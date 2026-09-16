import { HttpException } from "@nestjs/common";
import type { APIErrorDetail } from "@repo/types";
import { ERROR_STATUS, ErrorCode } from "../errors/error-code";

/**
 * 业务异常基类：把错误码固化为响应契约的一部分。
 *
 * 所有主动抛出的异常都用它 —— Service、ValidationPipe、Guard 统一成同一种形状，
 * 这样 HttpExceptionFilter 只需要识别这一种即可，不必为每种来源写分支。
 */
export class AppException extends HttpException {
  readonly details?: APIErrorDetail[];

  constructor(
    readonly code: ErrorCode,
    options?: { message?: string; details?: APIErrorDetail[] },
  ) {
    super({ code, message: options?.message }, ERROR_STATUS[code]);
    this.details = options?.details;
  }
}
