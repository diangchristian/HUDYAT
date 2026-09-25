import type { ReactNode } from "react";

type StaffPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Primary page actions, shown on the right (below the title on mobile). */
  actions?: ReactNode;
};

export default function StaffPageHeader({
  title,
  description,
  actions,
}: StaffPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-body text-2xl font-bold text-foreground sm:text-[32px] sm:leading-10">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}
