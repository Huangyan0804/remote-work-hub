import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
import { TeamMemberView, User } from "@repo/types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayload } from "../common/interface/jwt-payload.interface";
import { UpdateFocusDto } from "./dto/update-focus.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { MemberService } from "./member.service";

@Controller("members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  async list(
    @CurrentUser() currentUser: JwtPayload,
    @Query("teamId") teamId?: string,
  ): Promise<TeamMemberView[]> {
    return this.memberService.list(currentUser.sub, teamId);
  }

  @Patch("status")
  async updateStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<User> {
    return await this.memberService.updateStatus(
      currentUser.sub,
      updateStatusDto,
    );
  }

  @Patch("focus")
  async updateFocus(
    @CurrentUser() currentUser: JwtPayload,
    @Body() updateFocusDto: UpdateFocusDto,
  ): Promise<User> {
    return await this.memberService.updateFocus(
      currentUser.sub,
      updateFocusDto,
    );
  }
}
