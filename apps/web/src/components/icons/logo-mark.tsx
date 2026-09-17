import { cn } from "cn";
import { Orbit } from "lucide-react";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-sm bg-primary text-primary-foreground",
        className,
      )}
    >
      <Orbit className="size-4" />
    </span>
  );
}
