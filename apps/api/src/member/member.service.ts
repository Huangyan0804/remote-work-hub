import { Injectable } from "@nestjs/common";
import { ErrorCode } from "../common/errors/error-code";
import { AppException } from "../common/exceptions/app.exception";
import { PrismaService } from "../prisma/prisma.service";
import { toUser } from "../user/user.mapper";
import { UpdateFocusDto } from "./dto/update-focus.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { toMember } from "./member.mapper";

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUserId: string, teamId?: string) {
    if (!teamId) {
      const _teamId = await this.prisma.teamMember
        .findFirst({
          where: { userId: currentUserId },
          orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
        })
        .then((member) => member?.teamId || undefined);
      if (!_teamId) {
        return [];
      }
      teamId = _teamId;
    } else {
      const isMember = await this.prisma.teamMember
        .findUnique({
          where: {
            teamId_userId: {
              teamId: teamId,
              userId: currentUserId,
            },
          },
        })
        .then((member) => member !== null);
      if (!isMember) {
        throw new AppException(ErrorCode.TEAM_ACCESS_DENIED);
      }
    }

    return await this.prisma.teamMember
      .findMany({
        where: { teamId },
        include: { user: true },
        orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
      })
      .then((members) => members.map((m) => toMember(m.user, m)));
  }

  async updateStatus(currentUserId: string, updateStatusDto: UpdateStatusDto) {
    const user = await this.prisma.user.update({
      where: { id: currentUserId },
      data: { status: updateStatusDto.status },
    });
    return toUser(user);
  }

  async updateFocus(currentUserId: string, updateFocusDto: UpdateFocusDto) {
    const user = await this.prisma.user.update({
      where: { id: currentUserId },
      data: { focus: updateFocusDto.focus },
    });
    return toUser(user);
  }
}
