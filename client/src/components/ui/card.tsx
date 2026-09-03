import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Shared, non-interactive panel; CategoryCard remains the category selector. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-2xl border-2 border-border bg-card text-card-foreground", className)}
      {...props}
    />
  );
}
