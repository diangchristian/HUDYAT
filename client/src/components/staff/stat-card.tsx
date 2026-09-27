import type { LucideIcon } from "lucide-react";

import ProgressBar from "./progress-bar";
import { StaffCard } from "./staff-card";
import { STAFF_COLORS, type StaffColor } from "./staff-colors";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Small context after the value, e.g. "of 24" or "all submissions". */
  suffix?: string;
  color: StaffColor;
  /** Optional ratio bar under the value, e.g. { value: 3, max: 4 }. */
  progress?: { value: number; max: number };
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  progress,
}: StatCardProps) {
  const { tile, bar } = STAFF_COLORS[color];

  return (
    <StaffCard className="flex gap-4 p-5">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          tile,
        )}
      >
        <Icon aria-hidden="true" className="size-6" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-extrabold text-foreground tabular-nums">
            {value}
          </span>
          {suffix && (
            <span className="text-xs font-medium text-muted-foreground">
              {suffix}
            </span>
          )}
        </p>
        {progress && (
          <ProgressBar
            {...progress}
            label={label}
            barClassName={bar}
            className="mt-2"
          />
        )}
      </div>
    </StaffCard>
  );
}
