import { cn } from "@/lib/utils";

/** HUDYAT logo badge + wordmark used across the staff (teacher/admin) portal. */
export default function BrandMark({
  subtitle,
  className,
}: {
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-staff-brand font-body text-xl font-black text-white"
      >
        H
      </span>
      <div className="min-w-0">
        <p className="font-body text-2xl leading-7 font-black tracking-tight text-staff-brand">
          HUDYAT
        </p>
        <p className="truncate text-xs font-extrabold tracking-wide text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
