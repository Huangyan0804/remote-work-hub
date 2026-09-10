import type { AuthUser, User } from "@repo/types";
import type { User as PrismaUser } from "../generated/prisma/client";

/**
 * Prisma User 行 → 全量契约 User
 * 职责：挑字段 + 丢 passwordHash + Date 转 ISO 字符串
 */
export function toUser(row: PrismaUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    timezone: row.timezone,
    workHoursStart: row.workHoursStart,
    workHoursEnd: row.workHoursEnd,
    status: row.status,
    focus: row.focus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Prisma User 行 → 登录态精简契约 AuthUser */
export function toAuthUser(row: PrismaUser): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
  };
}
