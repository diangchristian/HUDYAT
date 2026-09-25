import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Gesture } from "@/api/teacher-api";

/* =========================================================
 * Gesture tile (a choice's sign image)
 * ======================================================= */

export default function GestureTile({
  gesture,
  letter,
  isCorrect,
  className,
}: {
  gesture: Gesture;
  letter: string;
  isCorrect: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border-2 bg-white",
        isCorrect ? "border-emerald-500" : "border-border",
        className,
      )}
    >
      <span className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-md border border-border bg-white text-xs font-bold text-muted-foreground">
        {letter}
      </span>
      {isCorrect && (
        <CheckCircle2
          aria-label="Correct answer"
          className="absolute top-1.5 right-1.5 size-5 fill-white text-emerald-600"
        />
      )}
      {gesture.referenceImageUrl ? (
        <img
          src={gesture.referenceImageUrl}
          alt={`Sign for ${gesture.label}`}
          loading="lazy"
          className="aspect-square w-full object-contain p-2"
        />
      ) : (
        <span className="flex aspect-square w-full items-center justify-center font-body text-3xl font-bold text-muted-foreground">
          {gesture.label}
        </span>
      )}
      <figcaption
        className={cn(
          "truncate border-t px-2 py-1.5 text-center text-sm font-bold",
          isCorrect
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-border text-foreground",
        )}
      >
        {gesture.label}
      </figcaption>
    </figure>
  );
}
