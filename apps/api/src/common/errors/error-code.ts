import { HttpStatus } from "@nestjs/common";

export const ErrorCode = {
  AUTH_EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED", // 守卫缺 token / token 无效 / 过期
  COMMON_VALIDATION_FAILED: "COMMON_VALIDATION_FAILED",
  COMMON_INTERNAL_ERROR: "COMMON_INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ERROR_STATUS: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: HttpStatus.BAD_REQUEST,
  [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.AUTH_USER_NOT_FOUND]: HttpStatus.BAD_REQUEST,
  // 重新认证 401
  [ErrorCode.AUTH_UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.COMMON_VALIDATION_FAILED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.COMMON_INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};
