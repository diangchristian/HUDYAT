/*
 * PROTOTYPE — throwaway. Functional pieces every color-treatment card
 * reuses unchanged: the edit/delete menu and the choice tiles.
 */
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import GestureTile from "@/components/staff/quiz-editor/gesture-tile";
import { choiceLetter } from "@/components/staff/quiz-editor/question-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CardProps } from "./outline-props";

export function CardActions({
  question,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  className,
}: Omit<CardProps, "categoryName"> & { className?: string }) {
  if (!canEdit && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for question ${question.questionNumber}`}
            className={className}
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
  );
}

export function ChoiceGrid({
  question,
  className,
}: {
  question: CardProps["question"];
  className?: string;
}) {
  return (
    <ul
      aria-label="Choices"
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}
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
  );
}
