import { ImageIcon, Video } from "lucide-react";

import type { Gesture, QuestionType } from "@/api/teacher-api";

export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;

/*
 * The two question types are two different mechanics, so they're named
 * by what the learner does rather than by media.
 */
export const QUESTION_TYPES: Record<
  QuestionType,
  { label: string; shortLabel: string; hint: string; icon: typeof Video }
> = {
  IMAGE_GESTURE: {
    label: "Pick the sign",
    shortLabel: "Pick the sign",
    hint: "Learners read the word and choose the matching sign picture.",
    icon: ImageIcon,
  },
  VIDEO_GESTURE: {
    label: "Name the sign (video)",
    shortLabel: "Name the sign",
    hint: "Learners watch the correct sign's video and choose the matching word.",
    icon: Video,
  },
};

/** `items` map for the question-type <Select>. */
export const QUESTION_TYPE_ITEMS = Object.fromEntries(
  Object.entries(QUESTION_TYPES).map(([value, { label }]) => [value, label]),
);

/**
 * A video question plays its correct sign's reference video, so it's
 * only playable when that sign has one.
 */
export const isMissingVideo = (
  questionType: QuestionType,
  gesture: Pick<Gesture, "referenceVideoUrl"> | undefined,
) => questionType === "VIDEO_GESTURE" && !gesture?.referenceVideoUrl;

export const missingVideoMessage = (label: string) =>
  `"${label}" has no reference video, so learners would see an empty player. Switch this question to "Pick the sign" or choose a different correct sign.`;

export type Feedback = { type: "success" | "error"; message: string } | null;

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/** A, B, C, ... for a choice's position. */
export const choiceLetter = (index: number) =>
  String.fromCharCode(65 + index);
