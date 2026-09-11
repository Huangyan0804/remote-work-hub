import {
  HttpStatus,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";
import { ErrorCode } from "./common/errors/error-code";
import { AppException } from "./common/exceptions/app.exception";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

// 生产 bootstrap 与 e2e 测试共用的"应用配置"。
// 好处：测试里起 app 不会丢掉 /api 前缀、ValidationPipe 与全局过滤器，保证测的是真实行为。
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
      // DTO 校验失败也抛 AppException，让错误来源收敛成一种形状。
      // 只取 constraints 的 key（规则名，如 isEmail/minLength），不取 value（那是 class-validator 的英文文案）。
      exceptionFactory: (errors: ValidationError[]) =>
        new AppException(
          ErrorCode.COMMON_VALIDATION_FAILED,
          HttpStatus.BAD_REQUEST,
          {
            details: errors.map((error) => ({
              field: error.property,
              rules: error.constraints ? Object.keys(error.constraints) : [],
            })),
          },
        ),
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
}
