import { Controller, Get } from "@nestjs/common";
import { SkipAuth } from "./common/decorators/skip-auth.decorator";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @SkipAuth()
  @Get("health")
  async health() {
    // 真实查一次数据库，能查到说明 Prisma + DB 全链路 OK
    const userCount = await this.prisma.user.count();
    return { status: "ok", db: "connected", userCount };
  }
}
