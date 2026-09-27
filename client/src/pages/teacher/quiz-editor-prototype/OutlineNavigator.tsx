/*
 * PROTOTYPE — throwaway. Aside variant 1 · "Question navigator": an
 * exam-style grid of numbered tiles, color-coded by state, with a
 * hover/focus preview of the question and quick stat pills.
 */
import { useState } from "react";
import { AlertTriangle, ImageIcon, ListOrdered, Plus, Video } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import {
  QUESTION_TYPES,
  isMissingVideo,
} from "@/components/staff/quiz-editor/question-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OutlineProps } from "./outline-props";

export default function OutlineNavigator({
  questions,
  editingId,
  canAdd,
  onAdd,
  onJump,
  totalPoints,
  attemptCount,
}: OutlineProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const warnings = questions.filter((q) => isMissingVideo(q.questionType, q.gesture)).length;
  const preview =
    questions.find((q) => q.id === previewId) ??
    questions.find((q) => q.id === editingId);

  return (
    <StaffCard className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <h2 className="flex items-center gap-2 font-bold text-foreground">
          <ListOrdered aria-hidden="true" className="size-4 text-primary" />
          Quiz outline
        </h2>
        {canAdd && (
          <Button size="sm" className="rounded-full" onClick={onAdd}>
            <Plus aria-hidden="true" /> Add
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-3 text-xs font-bold">
        <span className="rounded-full bg-muted px-2.5 py-1">{questions.length} questions</span>
        <span className="rounded-full bg-muted px-2.5 py-1">{totalPoints} pts</span>
        <span className="rounded-full bg-muted px-2.5 py-1">{attemptCount} taken</span>
        {warnings > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
            <AlertTriangle aria-hidden="true" className="size-3" />
            {warnings} to fix
          </span>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">Questions you add appear here.</p>
      ) : (
        <>
          <ol
            className="grid grid-cols-5 gap-2 p-4"
            onMouseLeave={() => setPreviewId(null)}
          >
            {questions.map((question) => {
              const missing = isMissingVideo(question.questionType, question.gesture);
              const active = editingId === question.id;
              const TypeIcon = question.questionType === "VIDEO_GESTURE" ? Video : ImageIcon;
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => onJump(question.id)}
                    onMouseEnter={() => setPreviewId(question.id)}
                    onFocus={() => setPreviewId(question.id)}
                    aria-label={`Question ${question.questionNumber}: ${question.questionText}`}
                    className={cn(
                      "relative flex aspect-square w-full items-center justify-center rounded-xl border text-sm font-extrabold transition",
                      active
                        ? "border-staff-nav bg-staff-nav text-white shadow-md"
                        : missing
                          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-transparent bg-muted text-foreground hover:border-primary/30 hover:bg-accent",
                    )}
                  >
                    {question.questionNumber}
                    <TypeIcon
                      aria-hidden="true"
                      className={cn(
                        "absolute top-1 right-1 size-2.5",
                        active ? "text-white/80" : "text-muted-foreground",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mx-4 mb-4 min-h-20 rounded-xl border border-dashed border-border p-3">
            {preview ? (
              <>
                <p className="text-xs font-bold text-muted-foreground">
                  Question {preview.questionNumber} ·{" "}
                  {QUESTION_TYPES[preview.questionType].shortLabel} · {preview.gesture.label}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
                  {preview.questionText}
                </p>
                {isMissingVideo(preview.questionType, preview.gesture) && (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    No video for this sign
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Hover a number to preview it; click to jump there.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-4 py-3 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded bg-staff-nav" /> Editing
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded border border-amber-300 bg-amber-50" /> Needs fix
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon aria-hidden="true" className="size-3" /> Pick
            </span>
            <span className="flex items-center gap-1">
              <Video aria-hidden="true" className="size-3" /> Name
            </span>
          </div>
        </>
      )}
    </StaffCard>
  );
}
