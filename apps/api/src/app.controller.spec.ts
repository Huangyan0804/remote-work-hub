import { Test } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma/prisma.service";

describe("AppController", () => {
  let controller: AppController;

  // 假 PrismaService：单测的核心纪律是"不碰真实数据库"
  // 数据库/网络属于集成测试范围（T2），单测只测本文件自己的逻辑
  const prismaMock = {
    user: {
      count: jest.fn().mockResolvedValue(3),
    },
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it("health 返回 ok / connected / 用户数", async () => {
    await expect(controller.health()).resolves.toEqual({
      status: "ok",
      db: "connected",
      userCount: 3,
    });
  });
});
