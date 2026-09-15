import { cn } from "cn";
import { Orbit } from "lucide-react";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-6 items-center justify-center", className)}>
      <Orbit className="size-4 rounded-sm bg-primary text-primary-foreground" />
    </span>
  );
}
