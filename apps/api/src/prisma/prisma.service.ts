import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    // Prisma 7：PostgreSQL 需显式传入 driver adapter（pg），连接池由 pg 管理。
    // 注入 ConfigService 由 NestJS DI 保证 ConfigModule 先完成 .env 加载，再取 DATABASE_URL
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>("DATABASE_URL"),
    });
    super({ adapter });
  }
}
