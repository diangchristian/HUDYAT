/*
 * PROTOTYPE — throwaway. Color treatment 1 · "By question type": color
 * carries meaning — "Pick the sign" is sky, "Name the sign" is violet —
 * on card header bands, badges and outline rows; totals get their own
 * accent tiles. Layout and functionality are unchanged.
 */
import { AlertTriangle, Plus } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import QuestionMediaPreview from "@/components/staff/quiz-editor/question-media-preview";
import {
  QUESTION_TYPES,
  isMissingVideo,
} from "@/components/staff/quiz-editor/question-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuestionType } from "@/api/teacher-api";
import type { CardProps, OutlineProps } from "./outline-props";
import { CardActions, ChoiceGrid } from "./parts";

const TONE: Record<
  QuestionType,
  { band: string; solid: string; soft: string; bar: string; text: string }
> = {
  IMAGE_GESTURE: {
    band: "border-sky-200 bg-sky-50",
    solid: "bg-sky-600 text-white",
    soft: "bg-sky-100 text-sky-800",
    bar: "bg-sky-500",
    text: "text-sky-800",
  },
  VIDEO_GESTURE: {
    band: "border-violet-200 bg-violet-50",
    solid: "bg-violet-600 text-white",
    soft: "bg-violet-100 text-violet-800",
    bar: "bg-violet-500",
    text: "text-violet-800",
  },
};

export function Card(props: CardProps) {
  const { question } = props;
  const tone = TONE[question.questionType];
  const TypeIcon = QUESTION_TYPES[question.questionType].icon;

  return (
    <StaffCard id={`question-${question.id}`} className="scroll-mt-24 overflow-hidden">
      <div className={cn("flex items-center justify-between gap-2 border-b px-5 py-3", tone.band)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("flex size-7 items-center justify-center rounded-lg text-xs font-extrabold", tone.solid)}>
            {question.questionNumber}
          </span>
          <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tone.soft)}>
            <TypeIcon aria-hidden="true" className="size-3.5" />
            {QUESTION_TYPES[question.questionType].label}
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
            {question.points} pt{question.points === 1 ? "" : "s"}
          </span>
        </div>
        <CardActions {...props} />
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <p className={cn("rounded-xl border p-4 font-semibold", tone.band, tone.text)}>
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
    <StaffCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-50 to-violet-50 px-4 py-3">
        <h2 className="text-xs font-extrabold tracking-wide text-sky-900 uppercase">
          Questions ({questions.length})
        </h2>
        {canAdd && (
          <Button size="icon-sm" className="rounded-full" aria-label="Add question" onClick={onAdd}>
            <Plus aria-hidden="true" />
          </Button>
        )}
      </div>

      {questions.length > 0 ? (
        <ol className="max-h-[50vh] space-y-1 overflow-y-auto p-2">
          {questions.map((question) => {
            const tone = TONE[question.questionType];
            const missing = isMissingVideo(question.questionType, question.gesture);
            return (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => onJump(question.id)}
                  className={cn(
                    "relative flex w-full items-center gap-3 overflow-hidden rounded-xl py-2 pr-2 pl-3 text-left transition-colors hover:bg-muted",
                    editingId === question.id && "bg-accent",
                  )}
                >
                  <span className={cn("absolute inset-y-1 left-0 w-1 rounded-full", tone.bar)} />
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold", tone.soft)}>
                    {question.questionNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {question.questionText}
                    </span>
                    <span className={cn("text-xs font-bold", tone.text)}>
                      {QUESTION_TYPES[question.questionType].shortLabel} · {question.gesture.label}
                    </span>
                  </span>
                  {missing && (
                    <AlertTriangle aria-label="No video for this sign" className="size-4 shrink-0 text-amber-600" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">Questions you add appear here.</p>
      )}

      <div className="flex gap-3 border-t border-border px-4 py-2 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-sky-800">
          <span className="size-2 rounded-full bg-sky-500" /> Pick the sign
        </span>
        <span className="flex items-center gap-1 text-violet-800">
          <span className="size-2 rounded-full bg-violet-500" /> Name the sign
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 border-t border-border p-4 text-center">
        <div className="rounded-xl bg-amber-100 p-2 text-amber-900">
          <dt className="text-xs font-semibold">Total points</dt>
          <dd className="font-extrabold">{totalPoints}</dd>
        </div>
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-900">
          <dt className="text-xs font-semibold">Submissions</dt>
          <dd className="font-extrabold">{attemptCount}</dd>
        </div>
      </dl>
    </StaffCard>
  );
}
