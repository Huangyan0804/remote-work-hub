# Remote Desk Hub

> 为异步沟通与分布式团队打造的轻量级远程协作工作台。

解决远程团队在**跨时区协作、任务状态透明化、异步进度汇报**场景下的核心痛点，展示端到端 TypeScript 类型安全、JWT 跨域鉴权与面向对象的模块化后端架构。

## 架构总览

前后端分离的 pnpm monorepo（Turborepo 管理任务）：

```text
┌───────────────────────────────────────────────┐
│          前端应用  apps/web (Next.js)         │
│    App Router + Tailwind CSS + React Query    │
└──────────────────────┬────────────────────────┘
                       │ HTTP / HTTPS (RESTful API + Bearer JWT)
                       ▼
┌───────────────────────────────────────────────┐
│       API 服务  apps/api (NestJS)             │
│       模块化架构 + Prisma ORM + JWT 鉴权      │
└──────────────────────┬────────────────────────┘
                       │ SQL (Prisma Client)
                       ▼
┌───────────────────────────────────────────────┐
│          PostgreSQL（Supabase / Neon）        │
└───────────────────────────────────────────────┘
```

## 技术栈

| 领域      | 前端 `apps/web`          | 后端 `apps/api`            |
| --------- | ------------------------ | -------------------------- |
| 框架      | Next.js (App Router)     | NestJS (Node.js)           |
| 语言      | TypeScript               | TypeScript                 |
| 样式/UI   | Tailwind CSS + shadcn/ui | —                          |
| 状态/请求 | Zustand + TanStack Query | —                          |
| 数据层    | —                        | Prisma ORM + PostgreSQL    |
| 鉴权      | Axios/fetch JWT 拦截器   | Passport.js + JWT + bcrypt |
| 校验      | Zod + React Hook Form    | class-validator            |

> 说明：以上为项目目标技术栈。当前骨架阶段已接入框架本体（NestJS / Next.js / Tailwind / Turborepo / 共享类型包），数据库、鉴权与业务模块将按[开发计划](./DEVELOPMENT_PLAN.md)逐步落地。

## 功能模块

### 认证与鉴权 (Auth)

- 用户注册（bcrypt 密码哈希）、登录、获取当前用户 Profile
- 前端路由守卫 + 请求拦截器自动注入 `Authorization: Bearer <token>`

### 团队与时区 (Team)

- 团队成员在线状态、所在时区与工作时间段展示
- 基于 `Intl` API 实时计算跨时区重叠工作窗口，可视化高亮

### 交互式看板 (Board)

- 任务增删改查，支持按状态 / 优先级 / 负责人过滤
- `@dnd-kit` 跨列拖拽 + React Query 乐观更新，失败自动回滚

### 异步日报 (Standup)

- 三段式日报表单（昨日完成 / 今日计划 / 阻碍事项）
- 分页历史存档 + 一键导出 Markdown / 复制 Slack 格式

## 项目结构

```text
remote-work-hub/
├── apps/
│   ├── api/                  # NestJS 后端服务 (端口 3001)
│   └── web/                  # Next.js 前端应用 (端口 3000)
├── packages/
│   ├── types/                # 前后端共享类型 (@repo/types)
│   ├── ui/                   # 基础 UI 组件库 (@repo/ui)
│   ├── biome-config/         # Biome 代码规范配置
│   └── typescript-config/    # 共享 tsconfig
├── describe.md               # 项目设计文档
└── DEVELOPMENT_PLAN.md       # 开发计划
```

## 快速开始

环境要求：Node.js >= 18、pnpm >= 9

```bash
# 1. 安装依赖
pnpm install

# 2. 启动全部应用（web + api）
pnpm dev

# 单独启动某个应用
pnpm dev --filter=web
pnpm dev --filter=api

# 构建
pnpm build

# 代码检查
pnpm check-types
```

启动后访问：

- 前端：http://localhost:3000
- API 健康检查：http://localhost:3001

### 数据库与迁移

```bash
# 1. 启动本地 PostgreSQL（在仓库根目录执行）
docker compose up -d

# 2. Prisma 常用命令（在 apps/api 目录执行；也可在根目录加 --filter api 前缀）
pnpm db:migrate --name <迁移说明>   # 修改 schema 后执行：生成迁移 + 同步表结构 + 重新生成客户端
pnpm db:generate                   # 只重新生成 Prisma Client
pnpm db:studio                     # 打开可视化数据库管理界面
pnpm db:migrate:deploy             # 生产部署时使用：只应用已提交的迁移文件
```

> 在仓库根目录执行示例：`pnpm --filter api db:migrate --name init`

### 类型检查与共享契约（check-types）

各包统一用 `tsc --noEmit` 做类型检查，Turborepo 按依赖图编排并缓存结果——改动某个包时，只会重跑该包及其依赖它的下游包。

```bash
# 全仓类型检查（等价于 turbo run check-types）
pnpm check-types

# 只查某个包
pnpm --filter @repo/types check-types
pnpm --filter api check-types
pnpm --filter web check-types
```

覆盖范围：`packages/types`、`packages/ui`、`apps/api`、`apps/web`。

使用时机与约定：

1. 修改 `apps/api/prisma/schema.prisma`（字段 / 枚举增删改）→ 执行迁移 + `db:generate` 后，跑一次全仓 `pnpm check-types`。
2. `packages/types`（`@repo/types`）是前后端共享的**契约层**：入口是未编译的原始 TS，只应通过 `import type` 引入，不参与运行时打包。
3. 契约 ≠ 数据库字段照搬：只放会跨 HTTP 边界传输的公开字段——去掉 `passwordHash`、关系数组；`DateTime` 转 ISO `string`；可空列写成 `field: string | null`（而非 `field?:`，避免"可选"与"可空"两种 JSON 语义混淆）。
4. 一旦 api / web 真正 `import type` 了 `@repo/types`，改动契约类型会因 turbo 缓存失效而让两端一起重跑——类型不同步会在 `check-types` 里立即报红，这就是"改一个类型、两端生效"的落地机制。
5. `check-types` 只负责类型正确性，不等于 lint / 构建通过。

## 环境变量

```bash
# apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/remote_work_hub"
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="7d"
PORT=3001

# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 部署建议

| 服务   | 建议平台                     |
| ------ | ---------------------------- |
| 前端   | Vercel                       |
| API    | Render / Railway             |
| 数据库 | Supabase / Neon (PostgreSQL) |

## 相关文档

- [设计文档 describe.md](./describe.md) — 模块划分与 API 路由设计
- [开发计划 DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — 分阶段实施路线图
