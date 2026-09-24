import { TeamMemberView } from "@repo/types";
import type {
  TeamMember as PrismaTeamMember,
  User as PrismaUser,
} from "../generated/prisma/client";
import { toUser } from "../user/user.mapper";

export function toMember(
  user: PrismaUser,
  member: PrismaTeamMember,
): TeamMemberView {
  return {
    ...toUser(user),
    role: member.role,
    teamId: member.teamId,
    userId: member.userId,
    joinedAt: member.joinedAt.toISOString(),
  };
}
