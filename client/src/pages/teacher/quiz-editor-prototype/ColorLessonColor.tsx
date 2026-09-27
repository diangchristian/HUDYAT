/*
 * PROTOTYPE — throwaway. Color treatment 3 · "Lesson color": everything
 * takes the lesson's own category color (the same one learners and the
 * Lessons page use): a colored outline header with the lesson icon, a
 * pastel strip on each card, and a tinted question canvas (set via the
 * page's sectionClassName). Layout and functionality are unchanged.
 */
import { AlertTriangle, Plus } from "lucide-react";

import { lessonPresentation } from "@/components/staff/lesson-presentation";
import { StaffCard } from "@/components/staff/staff-card";
import QuestionMediaPreview from "@/components/staff/quiz-editor/question-media-preview";
import {
  QUESTION_TYPES,
  isMissingVideo,
} from "@/components/staff/quiz-editor/question-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CardProps, OutlineProps } from "./outline-props";
import { CardActions, ChoiceGrid } from "./parts";

export function Card(props: CardProps) {
  const { question, categoryName } = props;
  const { theme } = lessonPresentation(categoryName);
  const TypeIcon = QUESTION_TYPES[question.questionType].icon;

  return (
    <StaffCard id={`question-${question.id}`} className="scroll-mt-24 overflow-hidden">
      <div className={cn("h-1.5", theme.progress)} />
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("flex size-7 items-center justify-center rounded-lg text-xs font-extrabold", theme.bg, theme.icon)}>
            {question.questionNumber}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-bold text-foreground">
            <TypeIcon aria-hidden="true" className={cn("size-3.5", theme.icon)} />
            {QUESTION_TYPES[question.questionType].label}
          </span>
          <span className="text-xs font-bold text-muted-foreground">
            {question.points} pt{question.points === 1 ? "" : "s"}
          </span>
        </div>
        <CardActions {...props} />
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <p className={cn("rounded-xl p-4 font-semibold text-foreground", theme.bg)}>
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
  categoryName,
}: OutlineProps) {
  const { icon: Icon, theme } = lessonPresentation(categoryName);

  return (
    <StaffCard className="overflow-hidden">
      <div className={cn("relative overflow-hidden px-4 py-4", theme.bg)}>
        <Icon aria-hidden="true" className={cn("absolute -right-3 -bottom-4 size-20 opacity-15", theme.icon)} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/80">
              <Icon aria-hidden="true" className={cn("size-4", theme.icon)} />
            </span>
            <div>
              <p className="text-sm font-extrabold text-foreground">{categoryName}</p>
              <p className="text-xs font-semibold text-foreground/60">
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          {canAdd && (
            <Button size="icon-sm" className="rounded-full" aria-label="Add question" onClick={onAdd}>
              <Plus aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {questions.length > 0 ? (
        <ol className="max-h-[50vh] space-y-1 overflow-y-auto p-2">
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
                    "flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted",
                    active && theme.bg,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                      active ? cn("border-transparent bg-white", theme.icon) : "border-border bg-white",
                    )}
                  >
                    {question.questionNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {question.questionText}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <TypeIcon aria-hidden="true" className={cn("size-3", theme.icon)} />
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

      <dl className="grid grid-cols-2 gap-2 border-t border-border p-4 text-center">
        <div className={cn("rounded-xl p-2", theme.bg)}>
          <dt className="text-xs text-foreground/70">Total points</dt>
          <dd className="font-extrabold text-foreground">{totalPoints}</dd>
        </div>
        <div className={cn("rounded-xl p-2", theme.bg)}>
          <dt className="text-xs text-foreground/70">Submissions</dt>
          <dd className="font-extrabold text-foreground">{attemptCount}</dd>
        </div>
      </dl>
    </StaffCard>
  );
}
