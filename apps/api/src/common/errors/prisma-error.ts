import { Prisma } from "../../generated/prisma/client";
import { AppException } from "../exceptions/app.exception";
import { ErrorCode } from "./error-code";

/** Prisma 已知错误码 → 业务错误码。只覆盖"框架层能确定语义"的部分 */
const PRISMA_CODE_TO_ERROR: Partial<Record<string, ErrorCode>> = {
  P2002: ErrorCode.COMMON_CONFLICT, // 唯一约束冲突
  P2003: ErrorCode.COMMON_CONFLICT, // 外键约束冲突
  P2025: ErrorCode.COMMON_NOT_FOUND, // 目标记录不存在
};

/**
 * 把 Prisma 已知错误归一成 AppException，识别不了返回 null 交回上层。
 *
 * 定位是"全局兜底"：service 若需要更精确的语义（如注册撞邮箱要 409 + 专属码），
 * 仍应在 service 里显式 catch，那个优先级更高。
 */
export function toAppException(error: unknown): AppException | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }
  const code = PRISMA_CODE_TO_ERROR[error.code];
  return code ? new AppException(code) : null;
}
