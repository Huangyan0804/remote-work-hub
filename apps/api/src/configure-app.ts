import { INestApplication, ValidationPipe } from "@nestjs/common";

// 生产 bootstrap 与 e2e 测试共用的"应用配置"。
// 好处：测试里起 app 不会丢掉 /api 前缀和 ValidationPipe，保证测的是真实行为。
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix("api");

  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}
