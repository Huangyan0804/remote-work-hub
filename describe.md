# Remote Work Hub — 项目设计与模块划分文档

> 本文按仓库**当前真实代码结构**编写：所有「已落地」内容都能在仓库中找到对应文件；业务模块与接口属于**规划**，推进状态见 [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)。
> 最近一次代码结构同步：2026-09-07

## 1. 项目简介 (Overview)

**Remote Work Hub** 是一款为异步沟通与分布式团队设计的轻量级远程协作工作台，解决**跨时区协作、任务状态透明化、异步进度汇报**场景下的核心痛点，用于展示**端到端 TypeScript 类型安全**、**JWT 跨域鉴权**、**NestJS 面向对象模块化后端**与 **Next.js 复杂 UI 交互**的综合全栈能力。

- **工程形态**：单仓库 pnpm monorepo（Turborepo 编排任务），前端 `apps/web` 与后端 `apps/api` 同库共存、前后端逻辑分离、可独立部署。
- **当前进度**：阶段 0（基础设施与工程化）已基本完成——数据库 + Prisma 7、NestJS 骨架与健康检查、共享类型包已贯通；认证 / 团队 / 看板 / 日报 / 设置等业务模块处于规划中。

## 2. 技术栈与实际状态 (Tech Stack & Status)

### 前端 `apps/web`

| 领域        | 选型                                                               | 状态                                 |
| ----------- | ------------------------------------------------------------------ | ------------------------------------ |
| 框架        | Next.js 16 (App Router)                                            | 已实现脚手架（`src/app`）            |
| 语言        | TypeScript                                                         | 已接入                               |
| 样式        | Tailwind CSS v4（`@tailwindcss/postcss`）                          | 已接入（`globals.css`）              |
| 状态/请求   | Zustand + TanStack Query                                           | 依赖已安装，Provider 与 store 未搭建 |
| 表单校验    | React Hook Form + Zod                                              | 依赖已安装，未使用                   |
| 拖拽        | `@dnd-kit/core`                                                    | 依赖已安装，未使用                   |
| HTTP 客户端 | Axios                                                              | 依赖已安装，拦截器未搭建             |
| UI 组件     | 规划 shadcn/ui；当前可先用 `@repo/ui` 基础组件（button/card/code） | 未接入                               |

### 后端 `apps/api`

| 领域         | 选型                                               | 状态                                        |
| ------------ | -------------------------------------------------- | ------------------------------------------- |
| 核心框架     | NestJS 12（模块化 + DI + Controller/Service）      | 骨架已实现（仅 AppController 健康检查）     |
| ORM / 数据库 | Prisma 7 + PostgreSQL（本地 Docker `postgres:16`） | 已实现：schema + 迁移 + PrismaService       |
| 安全与鉴权   | Passport.js + JWT + bcrypt                         | 依赖已安装，Guard / Strategy 未建（阶段 1） |
| 参数校验     | class-validator + class-transformer                | 依赖已安装，全局 `ValidationPipe` 已开启    |

### 共享包 `packages/*`

| 包                        | 选型                                       | 状态                                       |
| ------------------------- | ------------------------------------------ | ------------------------------------------ |
| `@repo/types`             | 前后端共享类型（契约层）                   | 已建立 `User` / `Task`，`Standup` 契约待补 |
| `@repo/ui`                | 基础 UI 组件（button/card/code）           | turbo 模板组件，未被引用                   |
| `@repo/typescript-config` | 共享 tsconfig（base/nextjs/react-library） | 已供各包使用                               |

## 3. 架构总览 (System Architecture)

```text
┌──────────────────────────────────────────────┐
│  apps/web  Next.js 16 (App Router)          │
│  Tailwind v4 · 规划 React Query / Zustand   │
└──────────────────────┬───────────────────────┘
                       │ HTTP REST + Bearer JWT
                       ▼
┌──────────────────────────────────────────────┐
│  apps/api  NestJS 12                         │
│  全局前缀 /api · CORS 白名单 localhost:3000  │
│  PrismaService (driver adapter: pg)          │
└──────────────────────┬───────────────────────┘
                       │ SQL (Prisma Client)
                       ▼
┌──────────────────────────────────────────────┐
│  PostgreSQL 16（docker-compose 本地库）      │
└──────────────────────────────────────────────┘

共享契约层 @repo/types：两端只 import type，跨 HTTP 边界传递的公开字段。
```

## 4. 仓库结构与定位 (Repo Layout)

```text
remote-work-hub/
├── apps/
│   ├── api/                       # NestJS 后端（默认端口 3001）
│   │   ├── src/
│   │   │   ├── main.ts            # 入口：全局前缀 /api、CORS、ValidationPipe
│   │   │   ├── app.module.ts      # 根模块（ConfigModule + PrismaModule）
│   │   │   ├── app.controller.ts  # GET /api/health 健康检查（真实查库）
│   │   │   ├── prisma/            # PrismaModule / PrismaService（注入 pg adapter）
│   │   │   └── generated/prisma/  # Prisma Client 生成产物，勿手改
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # 数据库模型唯一事实源（见 §5）
│   │   │   └── migrations/        # 迁移历史（init / rename_member_status_to_user_status）
│   │   ├── prisma.config.ts       # Prisma 7 CLI 配置（提供 DATABASE_URL）
│   │   └── (未来模块目录)          # src/modules/{auth,users,tasks,team,standups}
│   └── web/                       # Next.js 前端（默认端口 3000）
│       └── src/app/
│           ├── layout.tsx         # 根布局（Geist 字体，metadata 仍为模板默认值）
│           ├── page.tsx           # 首页（create-next-app 模板页，待替换）
│           ├── globals.css        # Tailwind v4 入口
│           └── favicon.ico
├── packages/
│   ├── types/src/index.ts         # @repo/types：User/UserStatus/Task/TaskStatus/TaskPriority
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

## 6. API 路由设计 (API Routes)

后端统一 `setGlobalPrefix("api")`，即所有接口形如 `/api/xxx`；CORS 白名单当前为 `http://localhost:3000`。

### 已实现

| 方法 | 路径          | 用途                                                  |
| ---- | ------------- | ----------------------------------------------------- |
| GET  | `/api/health` | 探活，真实执行 `user.count()` 验证 Prisma + DB 全链路 |

### 规划（对应 DEVELOPMENT_PLAN 阶段，均未实现）

**阶段 1 · 认证与鉴权 Auth**

| 方法 | 路径                 | 用途                                    |
| ---- | -------------------- | --------------------------------------- |
| POST | `/api/auth/register` | 注册（bcrypt 哈希入库）                 |
| POST | `/api/auth/login`    | 校验凭证，签发 JWT + 用户简信息         |
| GET  | `/api/auth/me`       | 当前用户 Profile（需 Token，JWT Guard） |

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

登录注册 `/login` `/register`（Auth Guard 保护，401 自动跳转）、团队时区 `/team`、任务看板 `/board`（`@dnd-kit` 拖拽 + React Query 乐观更新）、异步日报 `/standup`、设置 `/settings`。**当前 `src/app` 仅有模板首页，以上页面均未创建。**

## 7. 鉴权与跨域规范（规划）

- 后端：Passport JWT Strategy + Guard 保护业务路由；`bcrypt` 存密码哈希；DTO 经全局 `ValidationPipe`（`whitelist + transform`）校验。
- 前端：Axios 拦截器自动注入 `Authorization: Bearer <token>`；401 时清除登录态并跳转登录页；Zustand 持久化登录态。

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
