import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** White, softly shadowed panel used for every staff-portal surface. */
export function StaffCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function StaffCardHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

export function StaffCardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-lg font-bold text-foreground", className)}
      {...props}
    />
  );
}
