import { ImageIcon, Video } from "lucide-react";

import type { QuestionType } from "@/api/teacher-api";

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;

export const QUESTION_TYPES: Record<
  QuestionType,
  { label: string; icon: typeof Video }
> = {
  IMAGE_GESTURE: { label: "Image", icon: ImageIcon },
  VIDEO_GESTURE: { label: "Video", icon: Video },
};

/** `items` map for the question-type <Select>. */
export const QUESTION_TYPE_ITEMS = Object.fromEntries(
  Object.entries(QUESTION_TYPES).map(([value, { label }]) => [value, label]),
);

export type Feedback = { type: "success" | "error"; message: string } | null;

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/** A, B, C, ... for a choice's position. */
export const choiceLetter = (index: number) =>
  String.fromCharCode(65 + index);
