// prisma.config.ts：Prisma 7 配置文件，供 CLI（migrate / generate）读取数据库连接
// 应用运行时不需要它 —— PrismaService 里通过 driver adapter 直接读取 process.env
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
