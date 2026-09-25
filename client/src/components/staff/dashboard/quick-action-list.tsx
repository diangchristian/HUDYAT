import { Link } from "react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { STAFF_COLORS, type StaffColor } from "@/components/staff/staff-colors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  color: StaffColor;
  /** Optional count, e.g. lessons still missing a quiz. */
  badge?: number;
};

export default function QuickActionList({ actions }: { actions: QuickAction[] }) {
  return (
    <ul>
      {actions.map((action) => (
        <li key={action.label}>
          <Link
            to={action.to}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/70"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                STAFF_COLORS[action.color].tile,
              )}
            >
              <action.icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-bold text-foreground">
                {action.label}
                {action.badge ? (
                  <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[11px]">
                    {action.badge}
                  </Badge>
                ) : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {action.description}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
