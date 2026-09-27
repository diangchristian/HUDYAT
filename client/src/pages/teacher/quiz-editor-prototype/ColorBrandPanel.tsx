/*
 * PROTOTYPE — throwaway. Color treatment 2 · "Brand blue panel": the
 * outline becomes a solid HUDYAT-blue panel with white text; question
 * cards get a blue left accent and a light-blue question box. Layout and
 * functionality are unchanged.
 */
import { AlertTriangle, Plus } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import QuestionMediaPreview from "@/components/staff/quiz-editor/question-media-preview";
import {
  QUESTION_TYPES,
  isMissingVideo,
} from "@/components/staff/quiz-editor/question-types";
import { cn } from "@/lib/utils";
import type { CardProps, OutlineProps } from "./outline-props";
import { CardActions, ChoiceGrid } from "./parts";

export function Card(props: CardProps) {
  const { question } = props;
  const TypeIcon = QUESTION_TYPES[question.questionType].icon;

  return (
    <StaffCard
      id={`question-${question.id}`}
      className="scroll-mt-24 overflow-hidden border-l-4 border-l-staff-nav"
    >
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-staff-brand text-xs font-extrabold text-white">
            {question.questionNumber}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-staff-nav/10 px-2.5 py-1 text-xs font-bold text-staff-brand">
            <TypeIcon aria-hidden="true" className="size-3.5" />
            {QUESTION_TYPES[question.questionType].label}
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            {question.points} pt{question.points === 1 ? "" : "s"}
          </span>
        </div>
        <CardActions {...props} />
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <p className="rounded-xl bg-accent p-4 font-semibold text-staff-brand">
          {question.questionText}
        </p>
        {question.questionType === "VIDEO_GESTURE" && (
          <QuestionMediaPreview gesture={question.gesture} />
        )}
        <ChoiceGrid question={question} />
      </div>
    </StaffCard>
  );
}

export function Outline({
  questions,
  editingId,
  canAdd,
  onAdd,
  onJump,
  totalPoints,
  attemptCount,
}: OutlineProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-staff-brand text-white shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-extrabold tracking-wider text-white/80 uppercase">
          Questions ({questions.length})
        </h2>
        {canAdd && (
          <button
            type="button"
            aria-label="Add question"
            onClick={onAdd}
            className="flex size-7 items-center justify-center rounded-full bg-white text-staff-brand transition hover:bg-sky-100"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>

      {questions.length > 0 ? (
        <ol className="max-h-[50vh] space-y-1 overflow-y-auto px-2 pb-2">
          {questions.map((question) => {
            const active = editingId === question.id;
            const missing = isMissingVideo(question.questionType, question.gesture);
            const TypeIcon = QUESTION_TYPES[question.questionType].icon;
            return (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => onJump(question.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors",
                    active ? "bg-white text-staff-brand" : "hover:bg-white/10",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      active ? "bg-staff-brand text-white" : "bg-white/15",
                    )}
                  >
                    {question.questionNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {question.questionText}
                    </span>
                    <span className={cn("flex items-center gap-1 text-xs font-bold", active ? "text-staff-brand/70" : "text-white/70")}>
                      <TypeIcon aria-hidden="true" className="size-3" />
                      {QUESTION_TYPES[question.questionType].shortLabel} · {question.gesture.label}
                    </span>
                  </span>
                  {missing && (
                    <AlertTriangle aria-label="No video for this sign" className="size-4 shrink-0 text-amber-300" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-4 pb-4 text-sm text-white/80">Questions you add appear here.</p>
      )}

      <dl className="grid grid-cols-2 gap-2 border-t border-white/15 bg-black/10 p-4 text-center">
        <div className="rounded-xl bg-white/10 p-2">
          <dt className="text-xs text-white/75">Total points</dt>
          <dd className="font-extrabold">{totalPoints}</dd>
        </div>
        <div className="rounded-xl bg-white/10 p-2">
          <dt className="text-xs text-white/75">Submissions</dt>
          <dd className="font-extrabold">{attemptCount}</dd>
        </div>
      </dl>
    </div>
  );
}
