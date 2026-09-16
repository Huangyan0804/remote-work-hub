import { createHash, randomBytes } from "node:crypto";

/** 生成不透明随机串（绝不用 JWT——JWT 不可撤销） */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/** 只存哈希：即使数据库被读，也无法反推出 token 原文 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
