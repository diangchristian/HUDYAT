import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { StaffCard, StaffCardHeader } from "@/components/staff/staff-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthoringQuestion } from "@/api/teacher-api";
import GestureTile from "./gesture-tile";
import QuestionMediaPreview from "./question-media-preview";
import { QUESTION_TYPES, choiceLetter } from "./question-types";

/* =========================================================
 * Question card (read-only view)
 * ======================================================= */

export default function QuestionCard({
  question,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  question: AuthoringQuestion;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const TypeIcon = QUESTION_TYPES[question.questionType].icon;

  return (
    <StaffCard id={`question-${question.id}`} className="scroll-mt-24">
      <StaffCardHeader className="py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-6 gap-1 px-2 font-bold">
            <TypeIcon aria-hidden="true" data-icon="inline-start" />
            {QUESTION_TYPES[question.questionType].label}
          </Badge>
          <span className="text-xs font-bold text-muted-foreground">
            {question.points} point{question.points === 1 ? "" : "s"}
          </span>
        </div>

        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for question ${question.questionNumber}`}
                />
              }
            >
              <MoreHorizontal aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                  <Trash2 aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </StaffCardHeader>

      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-xs text-background">
              {question.questionNumber}
            </span>
            Question {question.questionNumber}
          </p>
          <p className="mt-2 rounded-xl bg-muted/60 p-4 text-foreground">
            {question.questionText}
          </p>
        </div>

        {question.questionType === "VIDEO_GESTURE" && (
          <QuestionMediaPreview gesture={question.gesture} />
        )}

        <ul
          aria-label="Choices"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {question.choices.map((choice, index) => (
            <li key={choice.id}>
              <GestureTile
                gesture={choice.gesture}
                letter={choiceLetter(index)}
                isCorrect={choice.isCorrect}
              />
            </li>
          ))}
        </ul>
      </div>
    </StaffCard>
  );
}
