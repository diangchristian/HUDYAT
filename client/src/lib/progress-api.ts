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

export async function getMyProgress(signal?: AbortSignal): Promise<MyProgress> {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${import.meta.env.VITE_API_URL ?? "http://localhost:5001"}/api/progress`,
    {
      credentials: "include",
      signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  if (!response.ok) {
    throw new Error(response.status === 401
      ? "Please log in to view your progress."
      : "We couldn't load your progress right now.");
  }
  const body = await response.json() as { data: MyProgress };
  return body.data;
}
