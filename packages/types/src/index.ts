// 成员状态枚举
export type UserStatus = "ONLINE" | "BUSY" | "OFFLINE";

// 团队成员实体结构
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  timezone: string; // e.g. 'Asia/Tokyo'
  workHoursStart: string; // e.g. '09:00'
  workHoursEnd: string; // e.g. '18:00'
  status: UserStatus;
  focus: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// 看板任务状态枚举
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

// 任务实体结构
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  dueDate: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// 字段级校验失败明细：rules 是 class-validator 的规则名（如 isEmail），前端据此查自己的文案。
export interface APIErrorDetail {
  field: string;
  rules: string[];
}

// 后端统一错误响应结构（由全局 HttpExceptionFilter 产出）。
// code 才是给前端做 i18n 的稳定 key；message 仅作开发期调试描述。
export interface APIError {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  details?: APIErrorDetail[];
}
