import { Separator } from "@base-ui/react";
import { LayoutDashboard, Timer, Users } from "lucide-react";
import { LogoMark } from "@/components/icons/logo-mark";
import { IconCircle } from "@/components/ui/icon-circle";

export default function AuthAside() {
  return (
    <aside className="hidden h-full flex-col items-start justify-start gap-6 bg-primary px-10 py-12 lg:flex">
      <header className="flex items-center gap-2">
        <LogoMark />
        <p className="font-semibold text-primary-foreground text-sm">
          远程协作工作台
        </p>
      </header>
      <p className="max-w-[22ch] font-semibold text-primary-foreground text-xl">
        跨时区协作，异步优先的远程团队工作台。
      </p>
      <div className="mt-auto flex w-full flex-col items-start justify-start gap-3">
        <div className="flex w-full items-center justify-center gap-3">
          <span className="text-nowrap font-semibold text-primary-foreground text-xs">
            今日团队概览
          </span>
          <Separator className="flex-1 opacity-20" />
        </div>

        <ul className="flex flex-col items-start gap-2.5">
          <li className="flex items-center gap-2">
            <IconCircle>
              <Users className="size-4 text-primary-foreground" />
            </IconCircle>
            <span className="text-primary-foreground text-sm">3 人在线</span>
          </li>
          <li className="flex items-center gap-2">
            <IconCircle>
              <LayoutDashboard className="size-4 text-primary-foreground" />
            </IconCircle>
            <span className="text-primary-foreground text-sm">
              12 个任务进行中
            </span>
          </li>
          <li className="flex items-center gap-2">
            <IconCircle>
              <Timer className="size-4 text-primary-foreground" />
            </IconCircle>
            <span className="text-primary-foreground text-sm">
              5 人已提交日报
            </span>
          </li>
        </ul>
      </div>
      <p className="">
        <span className="font-mono text-primary-foreground text-xs opacity-80">
          Asia/Tokyo · UTC+09:00
        </span>
      </p>
    </aside>
  );
}
