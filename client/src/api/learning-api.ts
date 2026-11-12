export type LearningStatus =
  | "completed"
  | "current"
  | "locked";

export type LessonStep =
  | "meaning"
  | "context"
  | "how"
  | "try";

export type LearningProgress = {
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED";

  lastGestureIndex: number;
  lastLessonStep: LessonStep | null;

  startedAt: string | null;
  completedAt: string | null;
};

export type LearningCategory = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;

  progress: LearningProgress;

  learningStatus: LearningStatus;
  progressPercent: number;
};

export type LearningArea = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;

  categories: LearningCategory[];
};

export type CategoryLesson = {
  category: {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
  } | null;

  /** Where the lesson sits in the learner's chain; a locked one can't be studied yet. */
  learningStatus?: LearningStatus;

  progress: LearningProgress;

  categoryGestures: Array<{
    id: string;
    exampleUsage: string | null;
    exampleUsagePictures: Record<string, string>;
    displayOrder: number;

    gesture: {
      id: string;
      label: string;
      meaning: string | null;
      mainPicture: string | null;
      meaningPictures: Record<string, string>;
      modelClass: string;
      referenceImageUrl: string | null;
      referenceVideoUrl: string | null;
    };
  }>;
};

import { api, unwrap } from "./http";

export function getLearningAreas() {
  return unwrap<LearningArea[]>(
    api.get("/api/learning/areas"),
  );
}

export function getCategoryLesson(
  categoryId: string,
) {
  return unwrap<CategoryLesson>(
    api.get(`/api/learning/categories/${categoryId}`),
  );
}

export function saveLessonCheckpoint(
  categoryId: string,
  gestureIndex: number,
  lessonStep: LessonStep,
) {
  return unwrap<LearningProgress>(
    api.patch(`/api/learning/categories/${categoryId}/checkpoint`, {
      gestureIndex,
      lessonStep,
    }),
  );
}