import type { AssessmentListCategory } from "@/api/assessment-api";

/** What a lesson's quiz card offers: its one button is always the next step. */
export type QuizCardStep = "locked" | "quiz" | "sign" | "again";

/*
 * Quiz first, then (in lessons the camera can check) the optional Sign test, then play again.
 * One button that changes, instead of two buttons side by side for young readers to choose between.
 */
export const quizCardStep = (lesson: Pick<AssessmentListCategory, "isUnlocked" | "status" | "signTest">): QuizCardStep => {
  if (!lesson.isUnlocked) return "locked";
  if (lesson.status !== "completed") return "quiz";
  if (lesson.signTest.hasModel && !lesson.signTest.best?.passed) return "sign";
  return "again";
};
