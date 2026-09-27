/*
 * PROTOTYPE — throwaway. Aside variant 3 · "Sign cards": a branded
 * gradient header with big totals and the add action, then each
 * question as a mini card led by its correct sign's picture.
 */
import { AlertTriangle, Plus } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import {
  QUESTION_TYPES,
  isMissingVideo,
} from "@/components/staff/quiz-editor/question-types";
import { cn } from "@/lib/utils";
import type { OutlineProps } from "./outline-props";

export default function OutlineSignCards({
  questions,
  editingId,
  canAdd,
  onAdd,
  onJump,
  totalPoints,
  attemptCount,
}: OutlineProps) {
  return (
    <StaffCard className="overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-br from-staff-brand to-staff-nav p-5 text-white">
        <span className="pointer-events-none absolute -top-8 -right-8 size-28 rounded-full bg-white/10" />
        <p className="relative text-xs font-bold tracking-wider text-white/80 uppercase">
          Questions
        </p>
        <div className="relative mt-2 grid grid-cols-3 gap-2">
          {[
            [questions.length, "questions"],
            [totalPoints, "points"],
            [attemptCount, "taken"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-white/15 px-2 py-2 text-center ring-1 ring-white/20">
              <p className="text-2xl leading-7 font-extrabold tabular-nums">{value}</p>
              <p className="text-[11px] font-semibold text-white/80">{label}</p>
            </div>
          ))}
        </div>
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-2 text-sm font-bold text-staff-brand shadow-lg shadow-black/10 transition hover:bg-sky-50"
          >
            <Plus aria-hidden="true" className="size-4" /> Add question
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Questions you add appear here.</p>
      ) : (
        <ol className="max-h-[50vh] space-y-2 overflow-y-auto bg-muted/30 p-3">
          {questions.map((question) => {
            const missing = isMissingVideo(question.questionType, question.gesture);
            const active = editingId === question.id;
            const isVideo = question.questionType === "VIDEO_GESTURE";
            const image = question.gesture.referenceImageUrl;
            return (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => onJump(question.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    active ? "border-staff-nav ring-2 ring-staff-nav/30" : "border-border",
                    missing && !active && "border-l-4 border-l-amber-400",
                  )}
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    {image ? (
                      <img src={image} alt="" loading="lazy" className="size-full object-contain p-1" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-sm font-extrabold text-muted-foreground">
                        {question.gesture.label}
                      </span>
                    )}
                    <span className="absolute top-0 left-0 flex size-5 items-center justify-center rounded-br-lg bg-foreground text-[10px] font-bold text-background">
                      {question.questionNumber}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {question.gesture.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {question.questionText}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          isVideo ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800",
                        )}
                      >
                        {QUESTION_TYPES[question.questionType].shortLabel}
                      </span>
                      {missing && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <AlertTriangle aria-hidden="true" className="size-2.5" /> No video
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </StaffCard>
  );
}
