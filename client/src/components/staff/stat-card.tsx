import type { LucideIcon } from "lucide-react";

import { StaffCard } from "./staff-card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Tailwind classes for the icon bubble, e.g. "bg-sky-100 text-sky-700". */
  tone: string;
  hint?: string;
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: StatCardProps) {
  return (
    <StaffCard className="flex flex-col gap-4 p-5 sm:p-6">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          tone,
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>

      <div>
        <p className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 font-body text-[32px] leading-10 font-bold text-foreground">
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </StaffCard>
  );
}
