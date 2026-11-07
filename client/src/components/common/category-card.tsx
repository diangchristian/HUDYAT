import { CheckCircle2, Lock, PlayCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import StatusBadge, { type StatusBadgeTone } from "./status-badge";
import {
  CATEGORY_THEME,
  type CategoryColor,
} from "./categories.constants";

export type { CategoryColor };

export type CategoryStatus = "completed" | "current" | "locked";

const STATUS_PRESENTATION: Record<
  CategoryStatus,
  { icon: LucideIcon; tone: StatusBadgeTone }
> = {
  completed: { icon: CheckCircle2, tone: "success" },
  current: { icon: PlayCircle, tone: "info" },
  locked: { icon: Lock, tone: "locked" },
};

export type CategoryCardProps = {
  title: string;
  icon?: LucideIcon;
  iconContent?: ReactNode;
  color: CategoryColor;
  desc?: string;
  className?: string;
  status?: CategoryStatus;
  statusLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function CategoryCard({
  title,
  icon: Icon,
  iconContent,
  color, 
  desc,
  className,
  status,
  statusLabel,
  disabled = false,
  onClick,
}: CategoryCardProps) {
  const style = CATEGORY_THEME[color];
  const resolvedStatusLabel = statusLabel ??
    (status === "completed" ? "Completed" : status === "current" ? "Continue" : status === "locked" ? "Locked" : undefined);

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "group flex w-full flex-col items-center border-2 bg-white transition-all duration-300",
        "shadow-[0_4px_0_rgba(0,0,0,0.08)]",
        "hover:-translate-y-1 hover:shadow-[0_6px_0_rgba(0,0,0,0.1)]",
        "active:translate-y-1 active:shadow-[0_1px_0_rgba(0,0,0,0.08)] active:duration-75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:shadow-none",
        style.border,
        "rounded-2xl px-3 py-4",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110",
          "size-12",
          style.bg,
          disabled && "opacity-60",
        )}
      >
        {iconContent ??
          (Icon && (
            <Icon
              aria-hidden="true"
              className={cn("size-6", style.icon, disabled && "opacity-70")}
            />
          ))}
      </div>

      <h3
        className={cn(
          "text-center font-semibold text-gray-800",
          "text-xs",
          disabled && "text-gray-500",
        )}
      >
        {title}
      </h3>

      {status && resolvedStatusLabel && (
        <StatusBadge
          icon={STATUS_PRESENTATION[status].icon}
          tone={STATUS_PRESENTATION[status].tone}
          label={resolvedStatusLabel}
          className="mt-2"
        />
      )}

      {desc && (
        <p className={cn("mt-2 text-center text-[10px] leading-tight", disabled ? "text-slate-500" : "text-gray-500")}>
          {desc}
        </p>
      )}
    </button>
  );
}
