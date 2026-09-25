import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max: number;
  /** Accessible name, e.g. "Alphabet lesson progress". */
  label: string;
  /** Fill color class, e.g. "bg-sky-500". Defaults to the primary color. */
  barClassName?: string;
  className?: string;
};

/** Thin, rounded ratio bar used across the staff portal. */
export default function ProgressBar({
  value,
  max,
  label,
  barClassName = "bg-primary",
  className,
}: ProgressBarProps) {
  const percent =
    max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full", barClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
