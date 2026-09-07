这是为你量身定制的 **前后端分离架构（Next.js 前端 + Node.js/NestJS 独立后端）** 版本的 **Remote Desk Hub** 完整设计与模块划分文档。

这份文档不仅明确了前后端的职责边界，还包含了**端到端 TypeScript 类型共享**与**跨域 JWT 鉴权**的规范，你可以直接保存为项目的开发指南。

---

# 📄 Remote Desk Hub - 前后端分离架构设计与开发规范

## 1. 项目简介 (Overview)

**Remote Desk Hub** 是一款专为异步沟通和分布式团队设计的轻量级工作台。项目旨在解决远程团队在**跨时区协作、任务状态透明化、异步进度汇报**等场景下的核心痛点。

- **架构模式：** 完全解耦的前后端分离架构（Decoupled Architecture）。
- **主要目标：** 打造标准的企业级 RESTful API 服务与高性能现代前端 UI，展示 **端到端 TypeScript 类型安全**、**JWT 跨域鉴权**、**面向对象后端架构（NestJS）** 以及 **复杂 UI 交互（Next.js + Tailwind）** 的综合全栈能力。

---

## 2. 核心技术栈 (Tech Stack)

### 🖥️ 前端仓库 (`remote-work-hub-web`)

| 领域            | 选型                                       | 核心作用                                                                    |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| **基础框架**    | **Next.js (App Router)**                   | 负责路由导航、SSR 落地页渲染与 SPA 客户端交互。                             |
| **开发语言**    | **TypeScript**                             | 前端静态类型检查。                                                          |
| **样式与UI**    | **Tailwind CSS + shadcn/ui**               | 原子化样式与高性能无障碍 UI 组件库。                                        |
| **状态与请求**  | **Zustand + TanStack Query (React Query)** | Zustand 管理本地 UI 状态；React Query 管理 API 异步请求、缓存与自动刷刷新。 |
| **HTTP 客户端** | **Axios / fetch 封装**                     | 处理 JWT Token 的自动注入与响应拦截器（Interceptor）。                      |

### ⚙️ 后端仓库 (`remote-work-hub-api`)

| 领域             | 选型                                    | 核心作用                                                                 |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| **核心框架**     | **NestJS (Node.js)**                    | 基于 TypeScript 的企业级后端框架（模块化、依赖注入、控制器与服务分离）。 |
| **ORM / 数据库** | **Prisma ORM + PostgreSQL**             | 类型安全的数据库查询与 Schema 迁移管理。                                 |
| **安全与鉴权**   | **Passport.js + JWT + bcrypt**          | 用户注册密码哈希加密、JWT 签发与 API 路由守卫（Guards）。                |
| **参数校验**     | **class-validator + class-transformer** | 后端 DTO (Data Transfer Object) 严格数据校验。                           |

---

## 3. 前后端分离架构图 (System Architecture)

```text
┌────────────────────────────────────────────────────────┐
│             前端客户端 (remote-work-hub-web)              │
│   Next.js (App Router) + Tailwind CSS + React Query    │
│                   托管平台: Vercel                     │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ HTTP / HTTPS (RESTful API + Bearer JWT Token)
                            ▼
┌────────────────────────────────────────────────────────┐
│             独立 API 后端 (remote-work-hub-api)           │
│         NestJS (TypeScript) + Prisma ORM               │
│                   托管平台: Render / Railway           │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ TCP / SQL (Prisma Client)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 PostgreSQL 云数据库                     │
│                 托管平台: Supabase / Neon              │
└───────────────────────────┴────────────────────────────┘

```

---

## 4. 模块划分与 API 路由设计 (Modules & API Routes)

### 模块 0：认证与鉴权模块 (Auth Module)

> **职责：** 处理用户注册、登录、Token 颁发与身份验证。

- **后端 (NestJS AuthModule):**
- `POST /api/auth/register` - 用户注册（密码用 bcrypt 哈希存储）。
- `POST /api/auth/login` - 校验凭证并返回 JWT Access Token 与 User 简信息。
- `GET /api/auth/me` - 获取当前登录用户的详细 Profile（需带 Token）。

- **前端实现：**
- `AuthGuard` / 路由中间件：未登录状态拦截并重定向至 `/login`。
- HTTP 请求拦截器：自动在 Request Header 中注入 `Authorization: Bearer <token>`。

---

### 模块 1：团队与时区仪表盘 (Team & Timezone Module)

> **职责：** 展示团队成员在线状态、计算跨时区重叠工作窗口（Overlap Hours）。

- **后端 (NestJS TeamModule):**
- `GET /api/members` - 获取团队成员列表及其当前状态、所在时区、工作时间段。
- `PATCH /api/members/status` - 更新个人当前状态（_Online / Busy / Off-work_）与今日焦点（_Today's Focus_）。

- **前端实现 (`/team` 页面):**
- 时区计算助手（`Intl` API）：根据成员时区实时渲染对方的本地时间。
- 重叠时间高亮组件：可视条形图展示不同时区的在线交集。

---

### 模块 2：交互式看板模块 (Board & Task Module)

> **职责：** Kanban 任务增删改查、跨列拖拽更新状态。

- **后端 (NestJS TaskModule):**
- `GET /api/tasks` - 获取所有任务列表（支持按 `status`, `priority`, `assigneeId` 过滤）。
- `POST /api/tasks` - 创建新任务。
- `PATCH /api/tasks/:id` - 更新任务详情（标题、描述、优先级、截止日期）。
- `PATCH /api/tasks/:id/status` - 专用于拖拽放开后，快速修改任务状态（`TODO` -> `IN_PROGRESS` -> `DONE`）和排序权重（`order`）。
- `DELETE /api/tasks/:id` - 删除任务。

- **前端实现 (`/board` 页面):**
- 使用 `@dnd-kit` 实现无缝拖拽。
- 使用 **React Query 乐观更新（Optimistic Updates）**：拖拽放开的瞬间 UI 立刻变化，同时后台异步向后端发 `PATCH` 请求，若失败则回滚 UI。

---

### 模块 3：异步日报生成器模块 (Standup Module)

> **职责：** 收集每日进度、生成格式化文本与历史存档。

- **后端 (NestJS StandupModule):**
- `POST /api/standups` - 提交今日 Standup（昨日完成、今日计划、阻碍事项）。
- `GET /api/standups` - 分页查询历史日报记录。
- `GET /api/standups/today` - 获取团队今日所有已提交的日报列表。

- **前端实现 (`/standup` 页面):**
- Zod + React Hook Form 校验三段式表单。
- 包含“一键导出 Markdown”与“一键复制 Slack 格式”按钮。

---

### 模块 4：用户偏好与设置模块 (Settings Module)

- **后端 (NestJS UserModule):**
- `PATCH /api/users/profile` - 修改个人姓名、头像、工作时间范围（如 `09:00 - 18:00`）和默认时区。

- **前端实现 (`/settings` 页面):**
- 主题切换（Light / Dark Mode）。
- 个人信息与时区修改表单。

---

## 5. 项目工程结构规划 (Monorepo 或 独立双仓库)

建议使用 **两个独立仓库**（最清晰、最容易独立部署）：

### 📂 前端仓库结构 (`remote-work-hub-web`)

```text
src/
├── app/                  # Next.js 路由
│   ├── (auth)/login/     # 登录页
│   ├── (dashboard)/      # 主控制台路由组
│   │   ├── team/         # 团队时区页
│   │   ├── board/        # 任务看板页
│   │   └── standup/      # 异步日报页
│   └── layout.tsx
├── components/           # UI 组件 (ui/, board/, team/ 等)
├── lib/
│   ├── api-client.ts     # Axios/fetch 实例 (配置 BaseURL 与 JWT 拦截器)
│   └── store.ts          # Zustand 本地 UI 状态
├── services/             # React Query API 请求封装 (tasks.api.ts, team.api.ts)
└── types/                # 前端类型声明

```

### 📂 后端仓库结构 (`remote-work-hub-api`)

```text
src/
├── modules/
│   ├── auth/             # 认证模块 (Controller, Service, JWT Strategy, Guards)
│   ├── users/            # 用户模块
│   ├── tasks/            # 任务看板模块
│   ├── team/             # 团队与时区模块
│   └── standups/         # 日报模块
├── prisma/
│   └── schema.prisma     # 数据库 PostgreSQL 模型定义
├── common/
│   ├── decorators/       # 自定义装饰器 (如 @CurrentUser())
│   └── filters/          # 全局 HTTP 异常捕获 (HttpExceptionFilter)
└── main.ts               # 入口文件 (配置 CORS 白名单、全局 ValidationPipe)

```

---
