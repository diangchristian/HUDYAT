/*
 * PROTOTYPE — throwaway. Contracts for quiz-editor color-treatment
 * variants: each supplies an outline (aside) and a question card with
 * exactly the current functionality, only restyled.
 */
import type { AuthoringQuestion } from "@/api/teacher-api";

export type OutlineProps = {
  questions: AuthoringQuestion[];
  /** Question currently open in the editor, or "new" while adding. */
  editingId: string | null;
  canAdd: boolean;
  onAdd: () => void;
  onJump: (questionId: string) => void;
  totalPoints: number;
  attemptCount: number;
  passingScore: number;
  categoryName: string;
};

export type CardProps = {
  question: AuthoringQuestion;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  categoryName: string;
};
