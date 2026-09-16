# Remote Work Hub — 项目设计与模块划分文档

> 本文按仓库**当前真实代码结构**编写：所有「已落地」内容都能在仓库中找到对应文件；业务模块与接口属于**规划**，推进状态见 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)。
> 最近一次代码结构同步：2026-09-16

## 1. 项目简介 (Overview)

**Remote Work Hub** 是一款为异步沟通与分布式团队设计的轻量级远程协作工作台，解决**跨时区协作、任务状态透明化、异步进度汇报**场景下的核心痛点，用于展示**端到端 TypeScript 类型安全**、**BFF 会话鉴权**、**NestJS 面向对象模块化后端**与 **Next.js 复杂 UI 交互**的综合全栈能力。

- **工程形态**：单仓库 pnpm monorepo（Turborepo 编排任务），前端 `apps/web` 与后端 `apps/api` 同库共存、前后端逻辑分离、可独立部署。
- **当前进度**：阶段 0（基础设施与工程化）已完成——数据库 + Prisma 7、NestJS 骨架与健康检查、共享类型包已贯通；**阶段 1（认证与鉴权）已落地**（BFF 会话 + 双令牌 + 刷新轮换，详见 §7）；团队 / 看板 / 日报 / 设置仍处规划阶段。

## 2. 技术栈与实际状态 (Tech Stack & Status)

### 前端 `apps/web`

| 领域        | 选型                                                               | 状态                                                  |
| ----------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| 框架        | Next.js 16 (App Router)                                            | 已实现（页面 + Route Handler 代理，见 §7）            |
| 语言        | TypeScript                                                         | 已接入                                                |
| 样式        | Tailwind CSS v4（`@tailwindcss/postcss`）                          | 已接入（`globals.css`）                               |
| 状态/请求   | Zustand + TanStack Query                                           | Zustand store 与 React Query Provider 已挂载          |
| 表单校验    | React Hook Form + Zod                                              | 已用于登录/注册表单                                   |
| 国际化      | next-i18next（App Router）                                         | 已接入，`.json` 语言包（zh），`proxy.ts` 中间件        |
| 拖拽        | `@dnd-kit/core`                                                    | 依赖已安装，未使用                                    |
| HTTP 客户端 | Axios                                                              | 已实现 `lib/api-client.ts`（同源 baseURL + 业务码拦截器） |
| UI 组件     | shadcn/ui 风格组件（`src/components/ui`）；`@repo/ui` 基础组件     | 已接入 20+ 组件                                       |

### 后端 `apps/api`

| 领域         | 选型                                               | 状态                                                       |
| ------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| 核心框架     | NestJS 12（模块化 + DI + Controller/Service）      | 已实现：AppModule 装配 Auth / User / Prisma 模块            |
| ORM / 数据库 | Prisma 7 + PostgreSQL（本地 Docker `postgres:16`） | 已实现：schema + 迁移 + PrismaService                       |
| 安全与鉴权   | Passport.js + JWT + bcrypt + Refresh Token         | 已实现：JwtStrategy + 全局 `JwtAuthGuard`（`@SkipAuth` 豁免） |
| 参数校验     | class-validator + class-transformer                | 依赖已安装，全局 `ValidationPipe` 已开启                    |
| 错误处理     | 全局 `HttpExceptionFilter` + 业务错误码            | 已实现：`ErrorCode` / `ERROR_STATUS` 查表，见 §7            |

### 共享包 `packages/*`

| 包                        | 选型                                       | 状态                                       |
| ------------------------- | ------------------------------------------ | ------------------------------------------ |
| `@repo/types`             | 前后端共享类型（契约层）                   | 已建立 `User` / `Task` / Auth 契约与 `APIError`，`Standup` 待补 |
| `@repo/ui`                | 基础 UI 组件（button/card/code）           | turbo 模板组件，未被引用                   |
| `@repo/typescript-config` | 共享 tsconfig（base/nextjs/react-library） | 已供各包使用                               |

## 3. 架构总览 (System Architecture)

```text
┌───────────────────────────────────────────────┐
│  apps/web  Next.js 16 (App Router)            │
│  页面 · Tailwind v4 · Zustand / React Query   │
│  浏览器不持有任何 token，只有 httpOnly Cookie │
└──────────────────────┬────────────────────────┘
                       │ 同源请求 /api/*（Cookie 自动携带）
                       ▼
┌───────────────────────────────────────────────┐
│  BFF 层  apps/web Route Handler               │
│  解密会话 Cookie 取出 token → 注入 Authorization │
│  access 过期时用 refresh 换新并重放原请求      │
└──────────────────────┬────────────────────────┘
                       │ HTTP REST + Bearer JWT
                       ▼
┌───────────────────────────────────────────────┐
│  apps/api  NestJS 12                          │
│  全局前缀 /api · CORS 白名单 localhost:3000    │
│  全局 JwtAuthGuard · PrismaService (pg adapter)│
└──────────────────────┬────────────────────────┘
                       │ SQL (Prisma Client)
                       ▼
┌───────────────────────────────────────────────┐
│  PostgreSQL 16（docker-compose 本地库）        │
└───────────────────────────────────────────────┘

共享契约层 @repo/types：两端只 import type，跨 HTTP 边界传递的公开字段。
```

## 4. 仓库结构与定位 (Repo Layout)

```text
remote-work-hub/
├── apps/
│   ├── api/                       # NestJS 后端（默认端口 3001）
│   │   ├── src/
│   │   │   ├── main.ts            # 入口：读 PORT，调用 configureApp
│   │   │   ├── configure-app.ts   # 全局前缀 /api、CORS、ValidationPipe、异常过滤器
│   │   │   ├── app.module.ts      # 根模块（ConfigModule + Prisma / Auth / User）
│   │   │   ├── app.controller.ts  # GET /api/health 健康检查（真实查库）
│   │   │   ├── auth/              # 认证模块（controller / service / jwt.strategy / guard / dto）
│   │   │   ├── user/              # 用户服务与 Prisma ↔ 契约映射（user.mapper）
│   │   │   ├── common/            # 错误码、AppException、全局过滤器、@SkipAuth
│   │   │   ├── prisma/            # PrismaModule / PrismaService（注入 pg adapter）
│   │   │   └── generated/prisma/  # Prisma Client 生成产物，勿手改
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # 数据库模型唯一事实源（见 §5）
│   │   │   └── migrations/        # 迁移历史（init / rename_member_status_to_user_status / add_refresh_token）
│   │   ├── prisma.config.ts       # Prisma 7 CLI 配置（提供 DATABASE_URL）
│   │   └── test/                  # e2e（复用 configureApp）
│   └── web/                       # Next.js 前端（默认端口 3000）
│       ├── src/app/
│       │   ├── layout.tsx         # 根布局（Geist 字体 + Providers）
│       │   ├── providers.tsx      # React Query / i18n / Toaster 等 Provider
│       │   ├── page.tsx           # 首页
│       │   ├── (auth)/            # 认证路由组：login 页面 + hooks + layout
│       │   ├── api/auth/          # BFF 端点：login / register / logout（写会话 Cookie）
│       │   ├── api/[...path]/     # BFF 通用代理：注入 token、过期自动 refresh 重放
│       │   └── globals.css        # Tailwind v4 入口
│       ├── src/lib/               # api-client（axios 实例）/ session（JWE 加解密）/ store（Zustand）
│       ├── src/components/ui/     # shadcn/ui 风格基础组件
│       └── src/i18n/locales/      # 语言包（zh：auth / common / errors）
├── packages/
│   ├── types/src/index.ts         # @repo/types：User / Task / Auth 契约 + APIError 等
│   ├── ui/src/                    # @repo/ui：button.tsx / card.tsx / code.tsx
│   └── typescript-config/         # 共享 tsconfig（base/nextjs/react-library）
├── describe.md                    # 本文档：设计与模块规划
├── DEVELOPMENT_PLAN.md            # 分阶段开发路线图（含完成勾选清单）
├── README.md                      # 人类可读的项目 README
├── docker-compose.yml             # 本地 PostgreSQL 16（库名 remote_work_hub）
├── package.json / turbo.json      # 根任务编排（build/dev/lint/format/check-types）
└── .trae/rules/                   # AI 项目规则（如 git 提交信息规范）
```

> 注意：`apps/web` 下另有 `AGENTS.md` / `CLAUDE.md`，为 Next.js 自动生成与维护的版本提示文件，无需人工编辑。

## 5. 数据库设计 (Data Model)

以 [apps/api/prisma/schema.prisma](./apps/api/prisma/schema.prisma) 为唯一事实源，Prisma 7 将客户端生成到 `src/generated/prisma`。

### 枚举

| 枚举           | 取值                                                         |
| -------------- | ------------------------------------------------------------ |
| `UserStatus`   | `ONLINE` / `BUSY` / `OFFLINE`（默认 `OFFLINE`）              |
| `TaskStatus`   | `TODO` / `IN_PROGRESS` / `IN_REVIEW` / `DONE`（默认 `TODO`） |
| `TaskPriority` | `LOW` / `MEDIUM` / `HIGH`（默认 `MEDIUM`）                   |

> 早期设计中存在 `OFF_WORK` 状态与独立 `Member` 表，已在迁移 `rename_member_status_to_user_status` 中合并进 `User`——**登录账号、个人资料、成员状态共用一张 `User` 表**，避免冗余。

### 模型

**User**（用户 = 账号 + 资料 + 成员状态）

| 字段                          | 类型                               | 说明                        |
| ----------------------------- | ---------------------------------- | --------------------------- |
| id                            | `String @id @default(cuid())`      | 主键                        |
| email                         | `String @unique`                   | 登录邮箱                    |
| passwordHash                  | `String`                           | bcrypt 哈希，**不进契约层** |
| name                          | `String`                           | 显示名                      |
| avatarUrl                     | `String?`                          | 头像                        |
| timezone                      | `String @default("Asia/Tokyo")`    | 时区                        |
| workHoursStart / workHoursEnd | `String @default("09:00"/"18:00")` | 工作时间段                  |
| status                        | `UserStatus @default(OFFLINE)`     | 当前状态                    |
| focus                         | `String?`                          | 今日焦点                    |
| createdAt / updatedAt         | `DateTime`                         | 审计字段                    |
| tasks / standups              | 关系数组                           | 一对多                      |

**Task**（看板任务）

| 字段        | 类型                            | 说明                        |
| ----------- | ------------------------------- | --------------------------- |
| id          | `String @id @default(cuid())`   | 主键                        |
| title       | `String`                        | 标题                        |
| description | `String?`                       | 描述                        |
| status      | `TaskStatus @default(TODO)`     | 看板列                      |
| priority    | `TaskPriority @default(MEDIUM)` | 优先级                      |
| order       | `Int @default(0)`               | 列内排序权重                |
| dueDate     | `DateTime?`                     | 截止日期                    |
| assigneeId  | `String?`                       | 负责人，`onDelete: SetNull` |

索引：`@@index([status])`、`@@index([assigneeId])`。

**Standup**（异步日报）

| 字段              | 类型                          | 说明                        |
| ----------------- | ----------------------------- | --------------------------- |
| id                | `String @id @default(cuid())` | 主键                        |
| yesterday / today | `String`                      | 昨日完成 / 今日计划         |
| blockers          | `String?`                     | 阻碍事项                    |
| date              | `DateTime @default(now())`    | 归属日期                    |
| userId            | `String`                      | 提交人，`onDelete: Cascade` |

索引：`@@index([userId, date])`。

**RefreshToken**（刷新令牌，BFF 会话续期的唯一凭据）

| 字段        | 类型                          | 说明                                                          |
| ----------- | ----------------------------- | ------------------------------------------------------------- |
| id          | `String @id @default(cuid())` | 主键                                                          |
| tokenHash   | `String @unique`              | **sha256 哈希**，不存明文（库被读也无法反推 token）           |
| familyId    | `String`                      | 同一登录会话派生的令牌共享；检出重放时整族吊销                |
| userId      | `String`                      | 归属用户，`onDelete: Cascade`                                 |
| expiresAt   | `DateTime`                    | 绝对过期时间；轮换时**继承**原值，避免令牌永不过期            |
| revokedAt   | `DateTime?`                   | 非空即已吊销（登出 / 轮换 / 重放检测）                        |
| createdAt   | `DateTime @default(now())`    | 签发时间                                                      |

索引：`@@index([userId, familyId])`、`@@index([expiresAt])`。

> 刷新令牌是不透明随机串（`randomBytes(32)`）而**不是 JWT**——JWT 无法撤销，而刷新令牌必须能吊销。Access Token（JWT，默认 15m）不入库，验证靠签名。

## 6. API 路由设计 (API Routes)

后端统一 `setGlobalPrefix("api")`，即所有接口形如 `/api/xxx`；CORS 白名单当前为 `http://localhost:3000`。

### 已实现

**基础**

| 方法 | 路径          | 用途                                                  |
| ---- | ------------- | ----------------------------------------------------- |
| GET  | `/api/health` | 探活，真实执行 `user.count()` 验证 Prisma + DB 全链路 |

**阶段 1 · 认证与鉴权 Auth**

| 方法 | 路径                 | 鉴权 | 用途                                                          |
| ---- | -------------------- | ---- | ------------------------------------------------------------- |
| POST | `/api/auth/register` | 公开 | 注册（bcrypt 哈希入库），直接返回令牌对                       |
| POST | `/api/auth/login`    | 公开 | 校验凭证，签发 Access + Refresh；`rememberMe` 决定 refresh 寿命 |
| GET  | `/api/auth/me`       | 需登录 | 返回当前用户 Profile（契约 `User`）                          |
| POST | `/api/auth/refresh`  | 公开 | 刷新令牌轮换：吊销旧的、同 family 下发新的；检出重放则整族吊销 |
| POST | `/api/auth/logout`   | 公开 | 吊销该 refresh 所属整族，返回 `204`（幂等）                   |

> 除 `@SkipAuth()` 标注的端点外，全局 `JwtAuthGuard` 默认保护所有路由。失败一律返回带 `code` 的 `APIError`（见 §7），前端据 `code` 而非 `status` 决策。

**BFF 端点（`apps/web` Route Handler，非后端 API）**

| 方法 | 路径                      | 用途                                                          |
| ---- | ------------------------- | ------------------------------------------------------------- |
| POST | `/api/auth/login`         | 转发登录，成功后 `sealSession` 写入 httpOnly 会话 Cookie       |
| POST | `/api/auth/register`      | 转发注册，同上                                                |
| POST | `/api/auth/logout`        | 通知后端吊销令牌，清 Cookie，返回 `204`                       |
| *    | `/api/[...path]`          | 通用代理：解密 Cookie 取 token 注入 `Authorization`；access 过期时用 refresh 换新并重放原请求，失败则清 Cookie 返回 `AUTH_UNAUTHORIZED` |

### 规划（对应 DEVELOPMENT_PLAN 阶段，均未实现）

**阶段 2 · 团队与时区 Team**

| 方法  | 路径                  | 用途                                            |
| ----- | --------------------- | ----------------------------------------------- |
| GET   | `/api/members`        | 成员列表（状态 / 时区 / 工作时间段）            |
| PATCH | `/api/members/status` | 更新本人状态（`ONLINE/BUSY/OFFLINE`）与今日焦点 |

**阶段 3 · 任务看板 Task**

| 方法   | 路径                    | 用途                                               |
| ------ | ----------------------- | -------------------------------------------------- |
| GET    | `/api/tasks`            | 任务列表（可按 `status/priority/assigneeId` 过滤） |
| POST   | `/api/tasks`            | 新建任务                                           |
| PATCH  | `/api/tasks/:id`        | 更新详情（标题/描述/优先级/截止日期）              |
| PATCH  | `/api/tasks/:id/status` | 拖拽落位后更新状态与排序（`order`）                |
| DELETE | `/api/tasks/:id`        | 删除任务                                           |

**阶段 4 · 异步日报 Standup**

| 方法 | 路径                  | 用途                           |
| ---- | --------------------- | ------------------------------ |
| POST | `/api/standups`       | 提交今日日报（昨日/今日/阻碍） |
| GET  | `/api/standups`       | 分页历史                       |
| GET  | `/api/standups/today` | 团队今日提交列表               |

**阶段 5 · 用户偏好 Settings**

| 方法  | 路径                 | 用途                              |
| ----- | -------------------- | --------------------------------- |
| PATCH | `/api/users/profile` | 修改姓名/头像/工作时间段/默认时区 |

### 前端页面规划

**已实现**：登录 `/login`（含 `redirect` 回跳、会话过期 toast 提示与国际化文案）。注册页 `(auth)/register` 已预留路由组与 hooks，页面待补。

**规划**：团队时区 `/team`、任务看板 `/board`（`@dnd-kit` 拖拽 + React Query 乐观更新）、异步日报 `/standup`、设置 `/settings`。路由保护不依赖 `AuthGuard` 组件，而是由 BFF 代理在会话失效时返回 `AUTH_UNAUTHORIZED`，前端拦截器统一跳转登录页（见 §7）。

## 7. 鉴权与跨域规范（已实现）

### 7.1 整体形态：BFF 会话鉴权

浏览器**不持有任何 token**，只有一个 httpOnly 会话 Cookie；所有请求打到同源的 Next.js Route Handler，由它解密 Cookie、注入 `Authorization` 再转发给 NestJS。

```text
浏览器 ──(同源 /api/*，带 rh_session Cookie)──▶ Next.js BFF ──(Bearer accessToken)──▶ NestJS
```

- 收益：token 不进 JS 作用域，天然免疫 XSS 窃取；跨域问题消失（同源），后端无需对浏览器暴露。
- 代价：Next.js 侧多一层代理，且 `API_BASE_URL` 只能在服务端使用。

### 7.2 令牌设计

| 令牌          | 形态                          | 寿命                            | 存放                          |
| ------------- | ----------------------------- | ------------------------------- | ----------------------------- |
| Access Token  | JWT（HS256，`sub` + `email`） | `JWT_EXPIRES_IN`（默认 15m）    | 加密进会话 Cookie             |
| Refresh Token | 不透明随机串（`randomBytes(32)`） | 勾「记住我」`JWT_REFRESH_DAYS`（30d）；否则 `JWT_REFRESH_SESSION_DAYS`（1d） | sha256 哈希入库 + 加密进 Cookie |

- Refresh Token 故意**不用 JWT**：JWT 自包含、无法撤销，而刷新令牌必须能吊销。
- 数据库只存 `tokenHash`，泄库也无法反推原文。

### 7.3 刷新轮换与重放检测

1. `POST /api/auth/refresh` 用 `tokenHash` 查库；
2. 若记录不存在 → `AUTH_UNAUTHORIZED`；
3. 若 `revokedAt` 非空或 `expiresAt` 已过 → 判定为重放/过期，**吊销整个 `familyId`** 后返回 `AUTH_UNAUTHORIZED`；
4. 正常则事务内「吊销旧记录 + 同 family 新建一条」，并**继承原 `expiresAt`**（否则刷新令牌会永不过期）。

### 7.4 会话 Cookie（`apps/web/src/lib/session.ts`）

- Cookie 名 `rh_session`，内容为 JWE（`EncryptJWT`，`dir` + `A256GCM`，密钥 `SESSION_SECRET`，需 32 字节 base64）。
- 属性：`httpOnly`、`sameSite: "lax"`、`path: "/"`、生产环境 `secure`。
- **「记住我」= 是否设置 `maxAge`**：设置则为持久 Cookie（30d），不设置则为会话 Cookie，关浏览器即失效。JWE 自身的 `exp` 与之同步（30d / 1d）。
- 加密属纵深防御：真正挡住 JS 读取的是 `httpOnly`。

### 7.5 前端错误处理契约：用业务码而非 HTTP 状态码

后端所有错误经全局 `HttpExceptionFilter` 输出统一结构 `APIError`：

```ts
{ statusCode, code, message, path, timestamp, details? }
```

`code` 是前端 i18n 的稳定 key；`message` 仅供开发期调试。关键设计是：

- **只看 `code`，不看 `status`**：例如 `AUTH_INVALID_CREDENTIALS` 故意返回 `400`（而非 401），这样登录页密码错误只显示表单错误，不会被 axios 拦截器误判为「会话过期」而触发跳转。
- 前端在 `@repo/types` 维护 `REAUTH_REQUIRED_CODES`（当前为 `["AUTH_UNAUTHORIZED"]`）白名单，`lib/api-client.ts` 响应拦截器命中后才清登录态并跳转 `/login?redirect=<当前页>`。
- `redirect` 为用户可控参数，`(auth)/hooks.ts` 做开放重定向校验：必须以 `/` 开头且不以 `//` 开头，否则回退 `/`。

### 7.6 后端

- `JwtStrategy` 校验 Bearer Token；`JwtAuthGuard` 以 `APP_GUARD` 注册为**全局守卫**，默认保护所有路由，`@SkipAuth()` 显式豁免（register / login / refresh / logout）。
- `JwtAuthGuard.handleRequest` 覆写 passport 默认行为，把无 code 的 `UnauthorizedException` 换成带 `AUTH_UNAUTHORIZED` 的 `AppException`；策略内部异常（`err` 非空）原样上抛，不伪装成 401。
- `bcrypt`（saltRounds = 10）存密码哈希；DTO 经全局 `ValidationPipe`（`whitelist + transform`）校验，失败转 `COMMON_VALIDATION_FAILED`。
- 登录失败与用户不存在**共用同一错误码**，不暴露「该邮箱是否已注册」；注册的并发竞态由 `P2002` 唯一索引冲突兜底为 `AUTH_EMAIL_ALREADY_EXISTS`。

### 7.7 跨域

后端 CORS 白名单当前为 `http://localhost:3000` 且 `credentials: true`。走 BFF 后浏览器只与 Next.js 同源通信，CORS 实际仅在直连后端调试时生效。

## 8. 端到端类型安全与开发约束

1. `@repo/types`（[packages/types/src/index.ts](./packages/types/src/index.ts)）是前后端共享的**契约层**：入口为原始 TS，只通过 `import type` 引入，不参与运行时打包。
2. 契约 ≠ 数据库字段照搬：只放跨 HTTP 边界传输的公开字段——去掉 `passwordHash`、关系数组；`DateTime` 转 ISO `string`；可空列写作 `field: string | null`（区分「可选」与「可空」两种 JSON 语义）。
3. 枚举需与 `schema.prisma` 双处同步：`UserStatus`、`TaskStatus`、`TaskPriority`（当前 `User` / `Task` 已对齐，`Standup` 契约待阶段 4 补充）。
4. 一旦 api / web `import type` 了 `@repo/types`，改动契约会使 turbo 缓存失效、两端一起重跑，类型不同步会在 `pnpm check-types` 立即报红。
5. 修改 `schema.prisma` 后执行迁移 + `db:generate`，再跑全仓 `pnpm check-types`。

常用命令（根目录）：`pnpm dev`（全量）、`pnpm dev --filter=api|web`、`pnpm build`、`pnpm check-types`；数据库 `docker compose up -d`；迁移在 `apps/api` 下 `pnpm db:migrate --name <说明>`。

## 9. 相关文档

- [README.md](./README.md) — 项目总览与快速开始
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — 分阶段实施路线图与验收清单
- [AGENTS.md](./AGENTS.md) — 面向 AI 的代码定位索引
