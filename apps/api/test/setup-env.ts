import { config as loadEnv } from "dotenv";

// 在 jest worker 内、任何模块加载前执行：e2e 进程从启动起就连测试库
loadEnv(); // 读取 apps/api/.env（dotenv 不会覆盖已存在的环境变量）

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error("e2e 需要 TEST_DATABASE_URL（请在 apps/api/.env 配置）");
}
process.env.DATABASE_URL = testUrl;
