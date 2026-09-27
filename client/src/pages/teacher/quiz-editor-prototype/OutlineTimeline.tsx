/*
 * PROTOTYPE — throwaway. Aside variant 2 · "Readiness timeline": a
 * publish-readiness checklist on top, then the questions as a vertical
 * timeline with each question's correct sign as its node.
 */
import { AlertTriangle, CheckCircle2, Circle, Plus, Target } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import {
  QUESTION_TYPES,
  isMissingVideo,
} from "@/components/staff/quiz-editor/question-types";
import { cn } from "@/lib/utils";
import type { OutlineProps } from "./outline-props";

function Check({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : Circle;
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-4 shrink-0",
          ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-muted-foreground",
        )}
      />
      <span className={cn(ok ? "text-foreground" : "font-semibold text-foreground")}>
        {children}
      </span>
    </li>
  );
}

export default function OutlineTimeline({
  questions,
  editingId,
  canAdd,
  onAdd,
  onJump,
  totalPoints,
  attemptCount,
  passingScore,
}: OutlineProps) {
  const broken = questions.filter((q) => isMissingVideo(q.questionType, q.gesture));
  const pointsToPass = Math.ceil((totalPoints * passingScore) / 100);

  return (
    <StaffCard className="overflow-hidden">
      <div className="border-b border-border bg-muted/40 p-4">
        <h2 className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
          Ready to publish?
        </h2>
        <ul className="mt-3 space-y-2">
          <Check ok={questions.length > 0}>
            {questions.length > 0
              ? `${questions.length} question${questions.length === 1 ? "" : "s"} written`
              : "Add at least one question"}
          </Check>
          <Check ok={broken.length === 0} warn={broken.length > 0}>
            {broken.length === 0
              ? "Every video question has a video"
              : `${broken.length} video question${broken.length === 1 ? "" : "s"} missing a video`}
          </Check>
        </ul>
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-muted-foreground">
          <Target aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span>
            Pass mark <strong className="text-foreground">{passingScore}%</strong> ={" "}
            <strong className="text-foreground">{pointsToPass}</strong> of {totalPoints} pts ·{" "}
            {attemptCount} taken
          </span>
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Questions you add appear here.</p>
      ) : (
        <ol className="relative max-h-[45vh] overflow-y-auto p-4 before:absolute before:top-8 before:bottom-8 before:left-[37px] before:w-0.5 before:bg-border">
          {questions.map((question) => {
            const missing = isMissingVideo(question.questionType, question.gesture);
            const active = editingId === question.id;
            const image = question.gesture.referenceImageUrl;
            return (
              <li key={question.id} className="relative mb-3 last:mb-0">
                <button
                  type="button"
                  onClick={() => onJump(question.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-muted",
                    active && "bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white text-xs font-bold",
                      active ? "border-staff-nav" : missing ? "border-amber-400" : "border-border",
                    )}
                  >
                    {image ? (
                      <img src={image} alt="" loading="lazy" className="size-full object-contain p-1" />
                    ) : (
                      question.gesture.label
                    )}
                    <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
                      {question.questionNumber}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold text-foreground">
                      {question.questionText}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          question.questionType === "VIDEO_GESTURE"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-sky-100 text-sky-800",
                        )}
                      >
                        {QUESTION_TYPES[question.questionType].shortLabel}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {question.points} pt{question.points === 1 ? "" : "s"}
                      </span>
                      {missing && (
                        <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-700">
                          <AlertTriangle aria-hidden="true" className="size-3" /> No video
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

      {canAdd && (
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus aria-hidden="true" className="size-4" /> Add question
          </button>
        </div>
      )}
    </StaffCard>
  );
}
