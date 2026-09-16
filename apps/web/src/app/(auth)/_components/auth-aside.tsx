import { Globe, Lock, ShieldCheck } from "lucide-react";
import { getT } from "next-i18next/server";
import { LogoMark } from "@/components/icons/logo-mark";
import { IconCircle } from "@/components/ui/icon-circle";
import { Separator } from "@/components/ui/separator";

export default async function AuthAside() {
  const { t } = await getT("auth");
  const { t: tCommon } = await getT("common");

  return (
    <aside className="hidden h-full flex-col items-start justify-start gap-6 bg-primary px-10 py-12 lg:flex">
      <header className="flex items-center gap-2">
        <LogoMark />
        <p className="font-semibold text-primary-foreground text-sm">
          {tCommon("app.name")}
        </p>
      </header>
      <p className="max-w-[22ch] font-semibold text-primary-foreground text-xl">
        {t("aside.tagline")}
      </p>
      <div className="mt-auto flex w-full flex-col items-start justify-start gap-3">
        <div className="flex w-full items-center justify-center gap-3">
          <span className="text-nowrap font-semibold text-primary-foreground text-xs">
            {t("aside.capabilities.title")}
          </span>
          <Separator className="flex-1 opacity-20" />
        </div>

        <ul className="flex flex-col items-start gap-2.5">
          <li className="flex items-center gap-2">
            <IconCircle>
              <Globe className="size-4 text-primary-foreground" />
            </IconCircle>
            <span className="text-primary-foreground text-sm">
              {t("aside.capabilities.timezone")}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <IconCircle>
              <ShieldCheck className="size-4 text-primary-foreground" />
            </IconCircle>
            <span className="text-primary-foreground text-sm">
              {t("aside.capabilities.sso")}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <IconCircle>
              <Lock className="size-4 text-primary-foreground" />
            </IconCircle>
            <span className="text-primary-foreground text-sm">
              {t("aside.capabilities.encryption")}
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
