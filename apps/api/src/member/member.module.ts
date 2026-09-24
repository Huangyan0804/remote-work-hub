import { Module } from "@nestjs/common";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

@Module({
  providers: [MemberService],
  exports: [MemberService],
  controllers: [MemberController],
})
export class MemberModule {}
