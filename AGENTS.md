# Remote Desk Hub — AI 代码定位索引 (AGENTS.md)

> 本文件面向 **AI 助手**：当用户就本仓库提问（改需求 / 修 Bug / 找实现）时，请先用下方「定位速查表」与「代码地图」定位到相关文件，再打开阅读与修改。
> 配套人类可读文档：[README.md](./README.md)（总览）、[describe.md](./describe.md)（设计 / 模块 / API 规划）、[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)（阶段路线图）。
> 索引同步时间：2026-09-16。仓库结构大改后请同步更新本文件与 describe.md。

## 0. 仓库一句话

pnpm + Turborepo 单仓库：`apps/web` = Next.js 16 前端（登录页 + BFF 代理已实现），`apps/api` = NestJS 12 + Prisma 7 后端（认证模块已落地），`packages/*` = 共享层（类型契约 / UI / 工程配置）。已完成基础设施与**认证鉴权**（BFF 会话 + 双令牌 + 刷新轮换，见 describe.md §7）；Team / Board / Standup / Settings 尚未实现，见 DEVELOPMENT_PLAN 阶段 2-5。

## 1. 定位速查表（先查这里）

| 当用户问到… | 直接打开 |
| --- | --- |
| 后端认证：注册 / 登录 / 刷新 / 登出 / 当前用户 | `apps/api/src/auth/auth.controller.ts` + `auth.service.ts` |
| JWT 守卫 / 校验策略 / 白名单豁免 | `apps/api/src/auth/jwt-auth.guards.ts`、`jwt.strategy.ts`、`apps/api/src/common/decorators/skip-auth.decorator.ts` |
| 刷新令牌生成与哈希（sha256）、轮换与重放检测 | `apps/api/src/auth/refresh-token.util.ts`；轮换逻辑在 `auth.service.ts` 的 `refresh()` |
| 后端登录/注册请求体校验规则 | `apps/api/src/auth/dto/{register,login,refresh}.dto.ts` |
| 取当前登录用户（控制器参数装饰器） | `apps/api/src/auth/decorators/current-user.decorator.ts` |
| 业务错误码与其 HTTP 状态映射 | `apps/api/src/common/errors/error-code.ts`（`ErrorCode` + `ERROR_STATUS`）、`common/exceptions/app.exception.ts` |
| 统一错误响应结构（`APIError`）怎么产出 | `apps/api/src/common/filters/http-exception.filter.ts` |
| 用户查询 / Prisma 实体 → 契约对象的映射 | `apps/api/src/user/user.service.ts`、`user.mapper.ts` |
| 后端新增/修改接口、路由、Guard | `apps/api/src/` 下模块（`auth/`、`user/`、`common/`） |
| 后端全局配置（`/api` 前缀 / CORS / ValidationPipe / 端口） | `apps/api/src/configure-app.ts`（`main.ts` 与 e2e 共用） |
| 根模块装配、模块导入 | `apps/api/src/app.module.ts` |
| 健康检查 / 探活接口实现 | `apps/api/src/app.controller.ts` |
| BFF 会话 Cookie 的加解密与属性（httpOnly / 记住我） | `apps/web/src/lib/session.ts` |
| BFF 通用代理（注入 token、过期自动 refresh 重放） | `apps/web/src/app/api/[...path]/route.ts` |
| BFF 登录 / 注册 / 登出端点 | `apps/web/src/app/api/auth/{login,register,logout}/route.ts` |
| 前端 token 失效后如何自动跳登录页 | `apps/web/src/lib/api-client.ts`（`REAUTH_REQUIRED_CODES` 拦截器）+ `apps/web/src/lib/store.ts` |
| 登录页表单、`redirect` 回跳与开放重定向校验 | `apps/web/src/app/(auth)/login/page.tsx`、`apps/web/src/app/(auth)/hooks.ts`、`(auth)/_api.ts` |
| 前端错误码 → 文案（i18n） | `apps/web/src/i18n/locales/zh/errors.json`、`apps/web/src/lib/get-error-message.ts` |
| Prisma 客户端如何连数据库 / 注入连接串 | `apps/api/src/prisma/prisma.service.ts`（PrismaPg adapter）+ `apps/api/src/prisma/prisma.module.ts` |
| 数据库模型 / 枚举 / 表结构 | `apps/api/prisma/schema.prisma`（唯一事实源） |
| 数据库迁移 / 建表历史 | `apps/api/prisma/migrations/` |
| Prisma CLI 数据库连接配置 | `apps/api/prisma.config.ts` |
| 数据库连接串 / 端口 / 环境变量 | `docker-compose.yml`、`apps/api/.env`、`apps/web/.env.local`（参考 README「环境变量」） |
| 前后端共享类型 / 契约（User/Task/Auth/APIError） | `packages/types/src/index.ts`（`@repo/types`） |
| 前端页面 / 布局 / 路由 | `apps/web/src/app/`（根布局 `layout.tsx`、首页 `page.tsx`、`(auth)/` 认证路由组、`api/` BFF） |
| 前端依赖里装了但还没用的库 | `apps/web/package.json`（`@dnd-kit/core` 等） |
| 前端已接入的组件与 Provider | `apps/web/src/components/ui/`、`apps/web/src/app/providers.tsx` |
| UI 基础组件（共享包） | `packages/ui/src/`（button / card / code，暂未被引用） |
| tsconfig 共享配置 | `packages/typescript-config/` |
| 项目整体设计与模块/API 规划 | `describe.md`（鉴权细节见 §7） |
| 开发进度与阶段清单（勾选项） | `DEVELOPMENT_PLAN.md` |
| 根级脚本命令（dev/build/check-types 等） | `package.json`、`turbo.json` |
| git 提交信息风格 | `.trae/rules/git-commit-message.md` |

## 2. 代码地图（文件级导航）

```text
remote-work-hub/
├── apps/
│   ├── api/                              # NestJS 12 后端
│   │   ├── src/
│   │   │   ├── main.ts                   # bootstrap：读 PORT(3001) 并调用 configureApp
│   │   │   ├── configure-app.ts          # 全局前缀 /api、CORS、ValidationPipe、全局异常过滤器
│   │   │   ├── app.module.ts             # AppModule：ConfigModule(global) + Prisma / Auth / User
│   │   │   ├── app.controller.ts         # GET /api/health（prisma.user.count() 探活）
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts        # 注册全局 JwtAuthGuard（APP_GUARD）、JwtModule
│   │   │   │   ├── auth.controller.ts    # register / login / me / refresh / logout
│   │   │   │   ├── auth.service.ts       # bcrypt 校验、签发令牌、刷新轮换 + 重放检测
│   │   │   │   ├── jwt.strategy.ts       # Passport JWT 校验（sub + email）
│   │   │   │   ├── jwt-auth.guards.ts    # 全局守卫，支持 @SkipAuth 豁免
│   │   │   │   ├── refresh-token.util.ts # 随机串生成 + sha256 哈希（不存明文）
│   │   │   │   ├── dto/                  # register / login / refresh 请求体校验
│   │   │   │   └── decorators/current-user.decorator.ts
│   │   │   ├── user/                     # UserService + user.mapper（Prisma → 契约对象）
│   │   │   ├── common/                   # error-code / app.exception / http-exception.filter / skip-auth
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts      # PrismaModule（global provider）
│   │   │   │   └── prisma.service.ts     # 继承 PrismaClient，注入 PrismaPg adapter + DATABASE_URL
│   │   │   └── generated/prisma/         # Prisma 7 生成的 Client（models/{User,Task,Standup,RefreshToken}.ts），勿手改
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # 模型事实源：User / Task / Standup / RefreshToken + 3 个枚举
│   │   │   └── migrations/               # init、rename_member_status_to_user_status、add_refresh_token
│   │   ├── test/                         # e2e（auth.e2e-spec.ts 等，复用 configure-app）
│   │   ├── prisma.config.ts              # Prisma CLI 读 env("DATABASE_URL")
│   │   └── package.json                  # db:* 脚本（migrate/generate/studio）
│   └── web/                              # Next.js 16 前端
│       ├── src/app/
│       │   ├── layout.tsx                # 根布局（Geist 字体 + Providers）
│       │   ├── providers.tsx             # React Query / i18n / Toaster
│       │   ├── page.tsx                  # 首页（业务页面规划见 describe.md §6）
│       │   ├── (auth)/                   # 认证路由组：login 页、hooks（redirect 校验）、_api、layout
│       │   ├── api/auth/{login,register,logout}/route.ts  # BFF 端点：写 / 清会话 Cookie
│       │   ├── api/[...path]/route.ts    # BFF 通用代理：注入 token，access 过期自动 refresh 重放
│       │   └── globals.css               # Tailwind v4
│       ├── src/lib/
│       │   ├── session.ts                # 会话 Cookie：JWE(AES-256-GCM) 加解密 + cookie 属性
│       │   ├── api-client.ts             # axios 实例（同源 baseURL）+ 失效跳登录页拦截器
│       │   └── store.ts                  # Zustand 登录态
│       ├── src/components/ui/            # shadcn/ui 风格组件
│       └── src/i18n/locales/zh/          # 语言包：auth / common / errors
├── packages/
│   ├── types/src/index.ts                # @repo/types：User/Task/Auth 契约 + APIError + REAUTH_REQUIRED_CODES（只 import type）
│   ├── ui/src/                           # @repo/ui：button.tsx / card.tsx / code.tsx（未被引用）
│   └── typescript-config/                # base.json / nextjs.json / react-library.json
├── describe.md                           # 设计与模块划分文档（鉴权见 §7）
├── DEVELOPMENT_PLAN.md                   # 阶段路线图（0-5 阶段、验收清单）
├── README.md                             # 项目 README（含快速开始/命令/环境变量）
├── docker-compose.yml                    # 本地 PostgreSQL 16（remote_work_hub）
├── package.json / turbo.json / pnpm-workspace.yaml / biome.json
└── .trae/rules/git-commit-message.md     # AI 提交信息规范
```

## 3. 回答前必须知道的关键约定

1. **状态划分**：`describe.md`、`DEVELOPMENT_PLAN.md` 中大量内容是「规划中」而非已实现。动手改代码前先确认该模块是否真实存在（已实现：`/api/health`、`/api/auth/*`、Prisma 链路、BFF 代理与登录页；前端其余页面仍未创建）。
2. **契约层规则**（`packages/types/src/index.ts`）：只 `import type`，不参与打包；不含 `passwordHash` / 关系数组；`DateTime` 用 ISO `string`；可空写 `field: string | null`（非 `field?`）。改契约会触发两端一起重跑类型检查。Auth 契约：`AuthUser` / `AuthResponse` / `TokenResponse`（**仅 BFF ↔ NestJS 之间传输**，绝不返回浏览器）/ `LoginRequest` / `APIError` / `REAUTH_REQUIRED_CODES`。
3. **枚举双处同步**：`UserStatus`（ONLINE/BUSY/**OFFLINE**，没有 OFF_WORK）、`TaskStatus`（TODO/IN_PROGRESS/IN_REVIEW/DONE）需在 `schema.prisma` 与 `@repo/types` 中保持一致。`@repo/types` 目前缺 Standup 契约。
4. **Prisma 7 特殊性**：client 生成到 `apps/api/src/generated/prisma`（不在 node_modules）；运行时靠 `PrismaPg` adapter 注入连接串；CLI 走 `prisma.config.ts`。schema 改动后需 `db:generate`。
5. **鉴权形态（BFF，勿退化）**：浏览器**不存 token**，只有一个 httpOnly 会话 Cookie（`rh_session`，JWE 加密，见 `apps/web/src/lib/session.ts`）；所有前端请求走同源 BFF（`apps/web/src/app/api/**`），由它注入 `Authorization` 转发。**排查鉴权问题先分清是 BFF 层还是 NestJS 层**。
6. **错误处理约定**：后端错误统一为 `APIError`（含 `code`），前端**按 `code` 决策而非 `status`**——`AUTH_INVALID_CREDENTIALS` 故意是 `400`，避免登录失败被误判成会话过期；只有 `REAUTH_REQUIRED_CODES` 命中才清登录态跳 `/login?redirect=...`。新增错误码需同时改 `apps/api/src/common/errors/error-code.ts` 与 `apps/web/src/i18n/locales/zh/errors.json`。
7. **环境变量边界**：`apps/web` 的 `API_BASE_URL` **禁止加 `NEXT_PUBLIC_` 前缀**（会泄漏后端地址到浏览器、绕过 BFF）；`SESSION_SECRET` 必须是 32 字节 base64，改动会使所有既有会话 Cookie 失效。
8. **Next.js 版本提示**：`apps/web/AGENTS.md`（及引它的 `apps/web/CLAUDE.md`）由 `next dev` 自动维护，规则见其内容；不要删除该文件。
9. **端口与跨域**：api 默认 3001、全局前缀 `/api`、CORS 白名单仅 `http://localhost:3000`；web 默认 3000。走 BFF 后浏览器只与 Next.js 同源通信，CORS 仅影响直连后端的调试。

## 4. 常用命令

```bash
pnpm dev                       # turbo 全量启动（web + api）
pnpm dev --filter=web|api      # 单独启动
pnpm check-types               # 全仓类型检查（改契约/DB 后必跑）
pnpm build
docker compose up -d           # 起本地 PostgreSQL
pnpm --filter api db:migrate --name <说明>   # schema 改动后：迁移 + 生成 client
pnpm --filter api db:studio    # 可视化查看数据库
pnpm --filter api test         # 后端单测（auth.service / auth.controller 等）
pnpm --filter api test:e2e     # 后端 e2e（含 auth.e2e-spec.ts）
pnpm --filter web test         # 前端单测（vitest）
pnpm --filter web test:e2e     # 前端 e2e（playwright）
```

## 5. 文档优先级

回答代码问题时优先级：**真实代码（本索引定位）> describe.md / DEVELOPMENT_PLAN.md（规划）**。若用户提问与文档描述冲突，以代码为准，并提示文档可能过期。
