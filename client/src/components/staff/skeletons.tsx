import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { StaffCard } from "./staff-card";

/*
 * Placeholder shapes shown by QueryState while a staff page's first
 * query runs. They're decorative (aria-hidden): QueryState's status
 * wrapper announces the loading text instead.
 */

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

export function StatCardSkeleton() {
  return (
    <StaffCard aria-hidden="true" className="flex gap-4 p-5">
      <Skeleton className="size-12 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-16" />
      </div>
    </StaffCard>
  );
}

/** `className` should be the real grid's classes so columns match. */
export function StatGridSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {range(count).map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** `className` should be the real grid's classes so columns match. */
export function CardGridSkeleton({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={className}>
      {range(count).map((i) => (
        <StaffCard key={i} className="overflow-hidden">
          <Skeleton className="h-28 rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </StaffCard>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <StaffCard aria-hidden="true" className="overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <Skeleton className="h-4 w-40" />
      </div>
      <ul className="divide-y divide-border">
        {range(rows).map((i) => (
          <li key={i} className="flex items-center gap-4 px-6 py-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="ml-auto hidden h-2 w-32 rounded-full sm:block" />
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    </StaffCard>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <StaffCard
      aria-hidden="true"
      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
    >
      <Skeleton className="size-16 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
    </StaffCard>
  );
}

export function SidePanelSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <StaffCard aria-hidden="true" className={cn("space-y-4 p-5", className)}>
      <Skeleton className="h-5 w-32" />
      {range(rows).map((i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </StaffCard>
  );
}
