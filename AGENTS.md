# Remote Desk Hub — AI 代码定位索引 (AGENTS.md)

> 本文件面向 **AI 助手**：当用户就本仓库提问（改需求 / 修 Bug / 找实现）时，请先用下方「定位速查表」与「代码地图」定位到相关文件，再打开阅读与修改。
> 配套人类可读文档：[README.md](./README.md)（总览）、[describe.md](./describe.md)（设计 / 模块 / API 规划）、[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)（阶段路线图）。
> 索引同步时间：2026-09-07。仓库结构大改后请同步更新本文件与 describe.md。

## 0. 仓库一句话

pnpm + Turborepo 单仓库：`apps/web` = Next.js 16 前端（目前只是脚手架首页），`apps/api` = NestJS 12 + Prisma 7 后端（骨架 + 健康检查已通），`packages/*` = 共享层（类型契约 / UI / 工程配置）。业务模块（Auth / Team / Board / Standup / Settings）尚未实现，见 DEVELOPMENT_PLAN 阶段 1-5。

## 1. 定位速查表（先查这里）

| 当用户问到… | 直接打开 |
| --- | --- |
| 后端新增/修改接口、路由、Guard | `apps/api/src/` 下模块（尚未建模块目录；现有入口与全局配置在 `apps/api/src/main.ts`） |
| 后端全局配置（`/api` 前缀 / CORS / ValidationPipe / 端口） | `apps/api/src/main.ts` |
| 根模块装配、模块导入 | `apps/api/src/app.module.ts` |
| 健康检查 / 探活接口实现 | `apps/api/src/app.controller.ts` |
| Prisma 客户端如何连数据库 / 注入连接串 | `apps/api/src/prisma/prisma.service.ts`（PrismaPg adapter）+ `apps/api/src/prisma/prisma.module.ts` |
| 数据库模型 / 枚举 / 表结构 | `apps/api/prisma/schema.prisma`（唯一事实源） |
| 数据库迁移 / 建表历史 | `apps/api/prisma/migrations/` |
| Prisma CLI 数据库连接配置 | `apps/api/prisma.config.ts` |
| 数据库连接串 / 端口 / 环境变量 | `docker-compose.yml`、`apps/api/.env`、`apps/web/.env.local`（参考 README「环境变量」） |
| 前后端共享类型 / 契约（User/Task 等） | `packages/types/src/index.ts`（`@repo/types`） |
| 前端页面 / 布局 / 路由 | `apps/web/src/app/`（目前仅 `layout.tsx` `page.tsx` `globals.css`） |
| 前端依赖里装了但还没用的库 | `apps/web/package.json`（axios / zustand / react-query / zod / @dnd-kit 等） |
| UI 基础组件 | `packages/ui/src/`（button / card / code） |
| tsconfig 共享配置 | `packages/typescript-config/` |
| 项目整体设计与模块/API 规划 | `describe.md` |
| 开发进度与阶段清单（勾选项） | `DEVELOPMENT_PLAN.md` |
| 根级脚本命令（dev/build/check-types 等） | `package.json`、`turbo.json` |
| git 提交信息风格 | `.trae/rules/git-commit-message.md` |

## 2. 代码地图（文件级导航）

```text
remote-work-hub/
├── apps/
│   ├── api/                              # NestJS 12 后端
│   │   ├── src/
│   │   │   ├── main.ts                   # bootstrap：/api 前缀、CORS、ValidationPipe、PORT(3001)
│   │   │   ├── app.module.ts             # AppModule：ConfigModule(global) + PrismaModule
│   │   │   ├── app.controller.ts         # GET /api/health（prisma.user.count() 探活）
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts      # PrismaModule（global provider）
│   │   │   │   └── prisma.service.ts     # 继承 PrismaClient，注入 PrismaPg adapter + DATABASE_URL
│   │   │   └── generated/prisma/         # Prisma 7 生成的 Client（含 models/{User,Task,Standup}.ts），勿手改
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # 模型事实源：User / Task / Standup + 3 个枚举
│   │   │   └── migrations/               # init、rename_member_status_to_user_status
│   │   ├── prisma.config.ts              # Prisma CLI 读 env("DATABASE_URL")
│   │   └── package.json                  # db:* 脚本（migrate/generate/studio）
│   └── web/                              # Next.js 16 前端
│       └── src/app/
│           ├── layout.tsx                # 根布局（Geist 字体；metadata 仍为模板默认）
│           ├── page.tsx                  # 首页模板（未开发，业务页面规划见 describe.md §6）
│           └── globals.css               # Tailwind v4
├── packages/
│   ├── types/src/index.ts                # @repo/types：UserStatus/User、TaskStatus/TaskPriority/Task（契约层，只 import type）
│   ├── ui/src/                           # @repo/ui：button.tsx / card.tsx / code.tsx（未被引用）
│   └── typescript-config/                # base.json / nextjs.json / react-library.json
├── describe.md                           # 设计与模块划分文档（与代码结构同步）
├── DEVELOPMENT_PLAN.md                   # 阶段路线图（0-5 阶段、验收清单）
├── README.md                             # 项目 README（含快速开始/命令/环境变量）
├── docker-compose.yml                    # 本地 PostgreSQL 16（remote_work_hub）
├── package.json / turbo.json / pnpm-workspace.yaml / biome.json
└── .trae/rules/git-commit-message.md     # AI 提交信息规范
```

## 3. 回答前必须知道的关键约定

1. **状态划分**：`describe.md`、`DEVELOPMENT_PLAN.md` 中大量内容是「规划中」而非已实现。动手改代码前先确认该模块是否真实存在（目前仅有 `/api/health` + Prisma 链路；前端仅脚手架首页）。
2. **契约层规则**（`packages/types/src/index.ts`）：只 `import type`，不参与打包；不含 `passwordHash` / 关系数组；`DateTime` 用 ISO `string`；可空写 `field: string | null`（非 `field?`）。改契约会触发两端一起重跑类型检查。
3. **枚举双处同步**：`UserStatus`（ONLINE/BUSY/**OFFLINE**，没有 OFF_WORK）、`TaskStatus`（TODO/IN_PROGRESS/IN_REVIEW/DONE）需在 `schema.prisma` 与 `@repo/types` 中保持一致。`@repo/types` 目前缺 Standup 契约。
4. **Prisma 7 特殊性**：client 生成到 `apps/api/src/generated/prisma`（不在 node_modules）；运行时靠 `PrismaPg` adapter 注入连接串；CLI 走 `prisma.config.ts`。schema 改动后需 `db:generate`。
5. **Next.js 版本提示**：`apps/web/AGENTS.md`（及引它的 `apps/web/CLAUDE.md`）由 `next dev` 自动维护，规则见其内容；不要删除该文件。
6. **端口与跨域**：api 默认 3001、全局前缀 `/api`、CORS 白名单仅 `http://localhost:3000`；web 默认 3000。

## 4. 常用命令

```bash
pnpm dev                       # turbo 全量启动（web + api）
pnpm dev --filter=web|api      # 单独启动
pnpm check-types               # 全仓类型检查（改契约/DB 后必跑）
pnpm build
docker compose up -d           # 起本地 PostgreSQL
pnpm --filter api db:migrate --name <说明>   # schema 改动后：迁移 + 生成 client
pnpm --filter api db:studio    # 可视化查看数据库
```

## 5. 文档优先级

回答代码问题时优先级：**真实代码（本索引定位）> describe.md / DEVELOPMENT_PLAN.md（规划）**。若用户提问与文档描述冲突，以代码为准，并提示文档可能过期。
