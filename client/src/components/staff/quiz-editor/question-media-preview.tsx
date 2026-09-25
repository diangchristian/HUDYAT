import { AlertTriangle } from "lucide-react";

import type { Gesture } from "@/api/teacher-api";
import { missingVideoMessage } from "./question-types";

/*
 * What a "Name the sign (video)" question plays for learners: the
 * correct sign's own reference video. Warns when there isn't one, since
 * learners would get an empty player.
 */
export default function QuestionMediaPreview({
  gesture,
}: {
  gesture: Gesture | undefined;
}) {
  if (!gesture) {
    return (
      <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
        Mark the correct choice to preview the video learners will watch.
      </p>
    );
  }

  if (!gesture.referenceVideoUrl) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
      >
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{missingVideoMessage(gesture.label)}</span>
      </p>
    );
  }

  return (
    <figure className="space-y-1.5">
      <video
        src={gesture.referenceVideoUrl}
        controls
        muted
        playsInline
        preload="metadata"
        className="aspect-video w-full max-w-sm rounded-xl bg-black object-contain"
      />
      <figcaption className="text-xs text-muted-foreground">
        Learners watch this video of "{gesture.label}".
      </figcaption>
    </figure>
  );
}
