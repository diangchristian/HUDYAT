export type ProgressCategory = {
  id: string;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPercent: number;
  completedAt: string | null;
  assessmentAttempts: number;
  latestAssessment: {
    score: number;
    totalPoints: number;
    percentage: number;
    completedAt: string;
  } | null;
};

export type MyProgress = {
  summary: {
    totalCategories: number;
    completedCategories: number;
    inProgressCategories: number;
    assessmentAttempts: number;
  };
  learningAreas: Array<{
    id: string;
    name: string;
    categories: ProgressCategory[];
  }>;
};

import { api, unwrap } from "./http";

export function getMyProgress(signal?: AbortSignal) {
  return unwrap<MyProgress>(api.get("/api/progress", { signal }));
}
