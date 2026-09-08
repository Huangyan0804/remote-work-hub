import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// setupServer = 在 Node 测试进程里起一个"假后端"，拦截真实 HTTP
export const server = setupServer(...handlers);