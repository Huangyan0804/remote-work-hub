# Remote Desk Hub 开发计划

> 面向**工作日上班、业余时间开发**的节奏设计。核心原则：**宽松、可弹性、不焦虑**。
> 建议节奏：工作日每晚 1-2 小时 + 周末一个半天，每阶段预留弹性缓冲，随时可暂停/调整。

## 节奏约定

| 约定     | 说明                                                       |
| -------- | ---------------------------------------------------------- |
| 时间单位 | 阶段（Phase），每阶段约 1-2 周，不设硬性截止日期           |
| 验收标准 | 每阶段末应用可运行、可演示、可提交（git commit）           |
| 弹性机制 | 某阶段延期不影响其他阶段；每阶段都有"最小完成项"与"可选项" |
| 里程碑   | 完成阶段 1 后项目可部署，之后每个阶段都是增量              |

## 阶段总览

| 阶段 | 内容                               | 估时（宽松） |
| ---- | ---------------------------------- | ------------ |
| 0    | 基础设施：数据库 + Prisma + 工程化 | 1-2 周       |
| 1    | 认证模块：注册 / 登录 / 鉴权链路   | 1-2 周       |
| 2    | 团队与时区模块                     | 1-2 周       |
| 3    | 任务看板模块（拖拽 + 乐观更新）    | 2-3 周       |
| 4    | 异步日报模块                       | 1-2 周       |
| 5    | 设置页 + 打磨 + 部署上线           | 1-2 周       |

总估时约 7-13 周（按业余时间弹性执行，不追赶进度）。

---

## 阶段 0：基础设施与工程化

**目标**：打通 monorepo 前后端、数据库与类型共享链路，让"改一个类型，两端都生效"跑起来。

### 后端 (apps/api)

- [x] 安装依赖：`@prisma/client`、`prisma`、`bcrypt`、`@nestjs/jwt`、`@nestjs/passport`、`passport-jwt`、`class-validator`、`class-transformer`
- [x] 数据库：本地 Docker Compose 起 PostgreSQL，或直接注册 Supabase / Neon 云库
- [x] Prisma：定义 schema（User / Member / Task / Standup），首次 migrate + seed
- [x] `main.ts`：开启 CORS（白名单 localhost:3000）、全局 `ValidationPipe`、全局前缀 `/api`
- [x] 安装 `@repo/types` 并创建 Prisma ↔ 共享类型映射

### 前端 (apps/web)

- [x] 安装依赖：`zustand`、`@tanstack/react-query`、`axios`、`zod`、`react-hook-form`、`@dnd-kit/core`、`tailwind-merge`、`clsx`
- [x] 搭建 `lib/api-client.ts`（axios 实例 + JWT 拦截器）与 `lib/store.ts`（Zustand）
- [x] 接入 shadcn/ui（按钮、输入框、卡片、对话框、下拉等基础组件）
- [x] React Query Provider 挂载到根布局

### 验收

- [x] `pnpm dev` 一键启动两端，前端可请求后端健康检查接口
- [x] `packages/types` 中的类型改动能被前后端同时感知（`pnpm check-types` 通过）

---

## 阶段 1：认证与鉴权模块

**目标**：完成用户注册 / 登录 / 获取当前用户，前端实现登录页与路由守卫。

### 后端

- [ ] `AuthModule`：`POST /api/auth/register`（bcrypt 哈希入库）
- [ ] `POST /api/auth/login`：校验凭证，签发 JWT（Access Token）+ 返回用户简信息
- [ ] `GET /api/auth/me`：JWT 守卫保护，返回当前用户 Profile
- [ ] 全局 `HttpExceptionFilter`，统一错误响应格式

### 前端

- [ ] 登录 / 注册页面（`(auth)/login`、`(auth)/register`）
- [ ] `AuthGuard`：未登录访问受保护页面时重定向至 `/login`
- [ ] axios 拦截器：自动注入 `Authorization: Bearer <token>`，401 时清除登录态并跳转
- [ ] Zustand 持久化登录态（token + user）

### 验收

- [ ] 注册 → 登录 → 刷新页面保持登录态 → 访问 `/me` 返回正确用户信息
- [ ] 退出登录后访问受保护页面被重定向

---

## 阶段 2：团队与时区模块

**目标**：展示团队成员在线状态与跨时区重叠工作窗口。

### 后端

- [ ] `TeamModule`：`GET /api/members` 返回成员列表（状态、时区、工作时间段）
- [ ] `PATCH /api/members/status`：更新当前状态（ONLINE / BUSY / OFF_WORK）与今日焦点
- [ ] seed 数据：预置 3-5 个不同时区（如 Tokyo / Singapore / San Francisco）的成员

### 前端

- [ ] `/team` 页面：成员卡片列表（头像、本地时间、状态徽章、今日焦点）
- [ ] 时区助手：`Intl.DateTimeFormat` 实时渲染各成员本地时间
- [ ] 重叠时间可视化：按成员工作时段的并集绘制小时条，高亮在线交集

### 验收

- [ ] 页面可查看多时区成员本地时间与重叠窗口
- [ ] 更新状态后刷新页面仍保持（已持久化）

---

## 阶段 3：任务看板模块

**目标**：实现 Kanban 任务 CRUD 与跨列拖拽，带乐观更新。

### 后端

- [ ] `TaskModule`：`GET /api/tasks`（支持 `status` / `priority` / `assigneeId` 过滤）
- [ ] `POST /api/tasks`、`PATCH /api/tasks/:id`（标题、描述、优先级、截止日期）
- [ ] `PATCH /api/tasks/:id/status`：更新状态与排序权重（`order`）
- [ ] `DELETE /api/tasks/:id`

### 前端

- [ ] `/board` 页面：四列看板（TODO → IN_PROGRESS → IN_REVIEW → DONE）
- [ ] 任务卡片：标题、负责人、优先级、截止日期；新建 / 编辑 / 删除对话框
- [ ] `@dnd-kit` 跨列拖拽，放开后调用 status 接口并乐观更新
- [ ] 过滤栏：按状态 / 优先级 / 负责人筛选

### 验收

- [ ] 新建任务 → 拖拽跨列 → 刷新页面状态与顺序正确
- [ ] 模拟接口失败时 UI 回滚（乐观更新生效）

---

## 阶段 4：异步日报模块

**目标**：提交每日 Standup 并支持历史存档与导出。

### 后端

- [ ] `StandupModule`：`POST /api/standups`（昨日完成 / 今日计划 / 阻碍事项）
- [ ] `GET /api/standups`：分页查询历史记录
- [ ] `GET /api/standups/today`：团队今日已提交列表

### 前端

- [ ] `/standup` 页面：Zod + React Hook Form 三段式表单，提交后清空
- [ ] 今日已提交成员列表（谁交了、谁没交）
- [ ] 历史记录列表 + 分页
- [ ] 一键导出 Markdown / 复制 Slack 格式按钮

### 验收

- [ ] 提交日报 → 今日列表即时更新 → 历史可翻页查看
- [ ] 导出的 Markdown / Slack 文本格式正确

---

## 阶段 5：设置页、打磨与部署

**目标**：完成偏好设置，整体打磨并部署上线。

### 后端

- [ ] `PATCH /api/users/profile`：修改姓名、头像、工作时间范围、默认时区

### 前端

- [ ] `/settings` 页面：个人资料表单 + 主题切换（Light / Dark）
- [ ] 全局打磨：空状态、错误提示、加载骨架、响应式布局、键盘可达性

### 部署

- [ ] API 部署至 Render / Railway（含环境变量与迁移命令）
- [ ] 前端部署至 Vercel（配置 `NEXT_PUBLIC_API_URL`）
- [ ] 生产环境联调：注册 → 登录 → 全功能走查

### 验收

- [ ] 生产地址可完整走通四个模块
- [ ] 修改设置后即时生效并持久化

---

## 日常开发建议

- 每晚先跑 `pnpm dev --filter=api` 与 `pnpm dev --filter=web`，保持热更新
- 每完成一个勾选项就 `git commit`，形成清晰提交历史
- 卡住超过 30 分钟就换个小任务，或停在该阶段做"最小完成项"
- 所有阶段的可选项（打磨、额外过滤等）都可以推迟到阶段 5 统一收尾

## 完成定义 (Definition of Done)

- [ ] 六个阶段全部勾选完成
- [ ] `pnpm build` 与 `pnpm check-types` 全量通过
- [ ] 生产环境完成一次全功能走查

---

## 自动化测试落地（测试关卡 T1–T7）

> 目标：按"企业常用流程"补齐自动化测试，同时作为换工作的技能练习。
> 技术选型：API 用 **Jest + supertest**（NestJS CJS 项目官方默认）；Web 用 **Vitest + RTL + MSW**；E2E 用 **Playwright**；CI 用 **GitHub Actions**。

### 关卡状态

- [x] T1 后端 Jest 单测环境（app.controller + mock PrismaService）
- [x] T2 Nest e2e（configureApp 重构 + health 集成测试）
- [x] T3 测试库隔离
- [x] T4 前端 Vitest + RTL + MSW
- [x] T5 turbo test 管线
- [x] T6 GitHub Actions CI（quality + api-e2e 双 job 全绿）
- [x] T7 Playwright E2E（webServer 三进程编排 + 健康检查真链路，passed）

### 踩坑记录（后续复用）

1. **TS 6 移除 rootDir 推断（TS5011）**：装了 typescript 6 后，tsconfig 必须显式 `"rootDir": "./src"`。ts-jest 只编译 spec 子集时公共源目录坍缩成 `./src` 必触发；`tsc --noEmit` 因文件集含根目录文件而不触发。
2. **rootDir 引发的 TS6059**：基础 tsconfig 加 rootDir 后必须配 `"include": ["src"]`，否则根目录 `prisma.config.ts` 被默认 `**/*` 兜入且不在 src 下报错。`prisma.config.ts` 仅 Prisma CLI 使用，不需要进 tsc 项目。
3. **编辑器识别 jest 全局**：tsconfig `"types"` 被显式限制为 `["node"]` 时，需改成 `["node", "jest"]`，否则 spec 里 `describe/it` 飘红。
4. **NestJS 12 是 ESM-first**：`@nestjs/*` 全部发布为纯 ESM（无 CJS 构建）。应用是 CJS 时靠 Node ≥24.9 的 require(esm) 运行。Jest 里必须用 `node --experimental-vm-modules node_modules/jest/bin/jest.js` 启动——jest 只有在 `vm.SourceTextModule.hasAsyncGraph` 存在时才走 require(esm) 原生桥，该 API 默认不暴露。
5. **Prisma 7 生成代码带 `.js` 后缀导入**：`src/generated/prisma/client.ts` 用 ESM 风格 `./internal/class.js` 指向 `.ts` 源文件。ts-jest 边编译边跑、磁盘上没有 `.js`，必须配 `"moduleNameMapper": { "^(\\.{1,2}/.*)\\.js$": "$1" }`（unit 和 e2e 两份 jest 配置都要加）。
6. **postgres 多库不能用 `POSTGRES_TEST_DB`**：官方镜像只认 `POSTGRES_DB`。多库靠 `docker-entrypoint-initdb.d/` 脚本，但脚本只在**空数据卷首次初始化**时执行——已存在的卷要手动 `docker compose exec postgres psql ... CREATE DATABASE`。
7. **jest globalSetup 的 env 传不到 worker**：globalSetup 跑在主进程、改的 `process.env` 不影响测试进程。运行时切库必须用 `setupFiles`（每个测试文件在 worker 里执行）。分工：globalSetup 准备 schema（跑迁移）、setupFiles 切 `DATABASE_URL`。
8. **e2e 断言不要硬编码具体数据**：测试库从阶段1起会被认证用例写入，断言"行为"而非"碰巧的值"（如 health 的 userCount 断言 `typeof === number` 而非 `0`）。
9. **Next 类型是运行时生成的（CI 干净检出必踩）**：`LayoutProps`/`PageProps` 等类型不是源码 import 的，由 Next 生成进 `.next/types/routes.d.ts`。本地因跑过 dev/build 有 `.next` 所以 `tsc --noEmit` 能过，CI 干净检出必报 TS2304。修法：`check-types` 改为 `next typegen && tsc --noEmit`（typegen 只需扫描路由、秒级）。
10. **vitest 默认 include 会误收 Playwright 用例**：vitest 默认匹配 `**/*.spec.*`，`e2e/health.spec.ts` 会被当单测收集并报 `Playwright Test did not expect test() to be called here`，连带把 turbo test 跑红。教训：**分层测试工具必须显式划地盘**——vitest `include` 限定 `src/`，Playwright 用 `testDir: ./e2e` 各自为政。
