import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CategoryColor =
  | "green"
  | "yellow"
  | "blue"
  | "purple"
  | "orange"
  | "red";

export type CategoryCardProps = {
  title: string;
  icon?: LucideIcon;
  iconContent?: ReactNode;
  color: CategoryColor;
  desc?: string;
  progress?: number;
  variant?: "default" | "progress";
  className?: string;
  onClick?: () => void;
};

const CATEGORY_COLORS = {
  green: {
    border: "border-lime-500",
    bg: "bg-lime-100",
    icon: "text-lime-600",
    progress: "bg-lime-500",
    progressText: "text-lime-500",
  },
  yellow: {
    border: "border-yellow-500",
    bg: "bg-yellow-100",
    icon: "text-yellow-600",
    progress: "bg-yellow-500",
    progressText: "text-yellow-600",
  },
  blue: {
    border: "border-sky-500",
    bg: "bg-sky-100",
    icon: "text-sky-600",
    progress: "bg-sky-500",
    progressText: "text-sky-600",
  },
  purple: {
    border: "border-purple-300",
    bg: "bg-purple-100",
    icon: "text-purple-500",
    progress: "bg-purple-400",
    progressText: "text-purple-500",
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-100",
    icon: "text-orange-500",
    progress: "bg-orange-500",
    progressText: "text-orange-500",
  },
  red: {
    border: "border-red-400",
    bg: "bg-red-100",
    icon: "text-red-500",
    progress: "bg-red-500",
    progressText: "text-red-500",
  },
};

export default function CategoryCard({ 
  title, 
  icon: Icon,
  iconContent,
  color, 
  desc,
  progress,
  variant = "default",
  className,
  onClick,
}: CategoryCardProps) {
  const style = CATEGORY_COLORS[color];
  const isProgressCard = variant === "progress";
  const safeProgress = Math.min(100, Math.max(0, progress ?? 0));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center border-2 bg-white transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        style.border,
        isProgressCard
          ? "min-h-40 rounded-3xl px-6 py-5"
          : "rounded-2xl px-3 py-4",
        className,
      )}
    >
      <div
        className={cn(
          "mb-3 flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110",
          isProgressCard ? "size-14" : "size-12",
          style.bg,
        )}
      >
        {iconContent ??
          (Icon && (
            <Icon
              aria-hidden="true"
              className={cn(isProgressCard ? "size-7" : "size-6", style.icon)}
            />
          ))}
      </div>

      <h3
        className={cn(
          "text-center font-semibold text-gray-800",
          isProgressCard ? "text-sm" : "text-xs",
        )}
      >
        {title}
      </h3>

      {desc && (
        <p className="mt-1 text-center text-[10px] leading-tight text-gray-500">
          {desc}
        </p>
      )}

      {isProgressCard && progress !== undefined && (
        <div className="mt-auto w-full pt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className={cn("text-lg font-bold", style.progressText)}>
              {safeProgress}%
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-label={`${title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={safeProgress}
          >
            <div
              className={cn("h-full rounded-full", style.progress)}
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
