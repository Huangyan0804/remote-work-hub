import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. 全局路由前缀：所有接口变成 /api/xxx
  app.setGlobalPrefix("api");

  // 2. 跨域：只允许前端地址访问（前后端分离必须配）
  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });

  // 3. 全局参数校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除 DTO 里没定义的字段
      transform: true, // 自动把字符串转成 DTO 声明的类型
    }),
  );

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
