// 成员状态枚举
export type MemberStatus = "ONLINE" | "BUSY" | "OFFLINE";

// 团队成员实体结构
export interface Member {
  id: string;
  name: string;
  email: string;
  timezone: string; // e.g., 'Asia/Tokyo'
  status: MemberStatus;
  workHoursStart: string; // e.g., '09:00'
  workHoursEnd: string; // e.g., '18:00'
}

// 看板任务状态枚举
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

// 任务实体结构
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}
