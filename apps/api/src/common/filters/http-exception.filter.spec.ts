import {
  ArgumentsHost,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { ErrorCode } from "../errors/error-code";
import { AppException } from "../exceptions/app.exception";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;

  /** filter 只用到 switchToHttp 的 request / response，这里造最小 host */
  function createHost(method = "GET", url = "/api/test") {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method, url }),
        getResponse: () => ({ status, json }),
      }),
    } as unknown as ArgumentsHost;
  }

  /** 造一个 Prisma 已知错误，用来验证全局兜底 */
  function prismaError(code: string) {
    return new Prisma.PrismaClientKnownRequestError("mock prisma error", {
      code,
      clientVersion: "7.10.0",
    });
  }

  beforeEach(() => {
    // 未预期错误那条分支会打错误日志，测试里静音避免噪音
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("AppException：直接用异常自带的 code 与 HTTP status", () => {
    filter.catch(new AppException(ErrorCode.TEAM_ACCESS_DENIED), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ErrorCode.TEAM_ACCESS_DENIED }),
    );
  });

  it("Prisma P2002（唯一约束冲突）：归一成 409，不再裸 500", () => {
    filter.catch(prismaError("P2002"), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        code: ErrorCode.COMMON_CONFLICT,
      }),
    );
  });

  it("Prisma P2003（外键约束冲突）：归一成 409", () => {
    filter.catch(prismaError("P2003"), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        code: ErrorCode.COMMON_CONFLICT,
      }),
    );
  });

  it("Prisma P2025（目标记录不存在）：归一成 404", () => {
    filter.catch(prismaError("P2025"), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        code: ErrorCode.COMMON_NOT_FOUND,
      }),
    );
  });

  it("未映射的 Prisma 错误码：不伪装成业务错误，仍走 500 兜底", () => {
    filter.catch(prismaError("P2034"), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ErrorCode.COMMON_INTERNAL_ERROR }),
    );
  });

  it("Nest 内置 401：按 status 反推 code", () => {
    filter.catch(new UnauthorizedException(), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: ErrorCode.AUTH_UNAUTHORIZED }),
    );
  });

  it("未预期的普通 Error：500 且响应不泄露堆栈", () => {
    filter.catch(new Error("connection refused"), createHost());

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.COMMON_INTERNAL_ERROR,
    });
    expect(body).not.toHaveProperty("stack");
  });

  it("响应体一律带请求 path 与 timestamp", () => {
    filter.catch(
      new AppException(ErrorCode.AUTH_UNAUTHORIZED),
      createHost("PATCH", "/api/members/status"),
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/members/status",
        timestamp: expect.any(String),
      }),
    );
  });
});
