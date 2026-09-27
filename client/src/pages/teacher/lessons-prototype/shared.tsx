/*
 * PROTOTYPE — throwaway. Shared bits for the `/teacher/lessons?variant=`
 * design exploration: a sign-image thumbnail and the quiz-status pill.
 */
import { cn } from "@/lib/utils";
import type { Gesture } from "@/api/teacher-api";
import type { Lesson } from "@/lib/lessons";

export function SignThumb({
  gesture,
  className,
}: {
  gesture: Gesture;
  className?: string;
}) {
  return gesture.referenceImageUrl ? (
    <img
      src={gesture.referenceImageUrl}
      alt={`Sign for ${gesture.label}`}
      loading="lazy"
      className={cn("object-contain bg-white", className)}
    />
  ) : (
    <span
      className={cn(
        "flex items-center justify-center bg-muted text-sm font-bold text-muted-foreground",
        className,
      )}
    >
      {gesture.label}
    </span>
  );
}

export function QuizPill({ lesson }: { lesson: Lesson }) {
  const status = lesson.assessment?.status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
        status === "PUBLISHED" && "bg-emerald-100 text-emerald-800",
        status === "DRAFT" && "bg-amber-100 text-amber-800",
        status === "ARCHIVED" && "bg-slate-200 text-slate-700",
        !status && "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "PUBLISHED" && "bg-emerald-500",
          status === "DRAFT" && "bg-amber-500",
          status === "ARCHIVED" && "bg-slate-500",
          !status && "bg-rose-500",
        )}
      />
      {status === "PUBLISHED"
        ? `Quiz live · ${lesson.assessment!.attemptCount} taken`
        : status === "DRAFT"
          ? "Quiz draft"
          : status === "ARCHIVED"
            ? "Quiz archived"
            : "No quiz yet"}
    </span>
  );
}
