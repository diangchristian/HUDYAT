import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusBadgeTone = "success" | "info" | "neutral" | "locked";

export type StatusBadgeProps = {
  icon: LucideIcon;
  label: string;
  tone: StatusBadgeTone;
  className?: string;
};

const TONE_STYLES: Record<StatusBadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  locked: "border-slate-300 bg-slate-200 text-slate-500",
};

export default function StatusBadge({
  icon: Icon,
  label,
  tone,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold",
        TONE_STYLES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
