import type { LucideIcon } from "lucide-react";

export type StatTileProps = {
  icon: LucideIcon;
  value: string | number;
  label: string;
  colorClassName: string;
};

export default function StatTile({
  icon: Icon,
  value,
  label,
  colorClassName,
}: StatTileProps) {
  return (
    <article className="flex items-center gap-4 rounded-3xl border-2 border-transparent bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`flex size-14 shrink-0 items-center justify-center rounded-full ${colorClassName}`}
      >
        <Icon aria-hidden="true" className="size-7" />
      </div>

      <div className="min-w-0">
        <p className="text-3xl font-extrabold text-foreground">{value}</p>

        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
    </article>
  );
}
