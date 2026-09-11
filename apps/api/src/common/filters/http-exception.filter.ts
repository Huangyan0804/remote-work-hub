import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { APIError } from "@repo/types";
import type { Request, Response } from "express";
import { ErrorCode } from "../errors/error-code";
import { AppException } from "../exceptions/app.exception";

// status → 兜底错误码：给那些绕过 AppException 的异常用
// （Nest 内置的 404、第三方库抛出的 HttpException 等，无法收编进 AppException）
const STATUS_FALLBACK_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.UNAUTHORIZED]: ErrorCode.AUTH_UNAUTHORIZED,
  [HttpStatus.BAD_REQUEST]: ErrorCode.COMMON_VALIDATION_FAILED,
};

/**
 * 全局异常过滤器：统一错误响应格式。
 * 用无参 @Catch() 抓全部异常 —— 若写成 @Catch(HttpException)，
 * 未预期的 Error（DB 断连、代码 bug）会漏出去走 Nest 默认响应。
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toResponseBody(exception, request);

    response.status(body.statusCode).json(body);
  }

  private toResponseBody(exception: unknown, request: Request): APIError {
    const base = {
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 分支 1：自己抛的业务异常，code 直接用异常上带的
    if (exception instanceof AppException) {
      return {
        ...base,
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    // 分支 2：其他 HttpException 兜底（Nest 内置 404、第三方库），按 status 反推 code
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        ...base,
        statusCode,
        code:
          STATUS_FALLBACK_CODE[statusCode] ?? ErrorCode.COMMON_INTERNAL_ERROR,
        message: exception.message,
      };
    }

    // 分支 3：完全未预期的错误。堆栈只进日志，响应不泄露内部细节。
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.COMMON_INTERNAL_ERROR,
      message: ErrorCode.COMMON_INTERNAL_ERROR,
    };
  }
}
