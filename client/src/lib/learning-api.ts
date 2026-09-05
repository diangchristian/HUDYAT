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

  progress: LearningProgress;

  categoryGestures: Array<{
    id: string;
    exampleUsage: string | null;
    demonstrationVideoUrl: string | null;
    displayOrder: number;

    gesture: {
      id: string;
      label: string;
      meaning: string | null;
      modelClass: string;
      referenceImageUrl: string | null;
      referenceVideoUrl: string | null;
    };
  }>;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001";

async function request<T>(
  path: string,
): Promise<T> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      credentials: "include",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Please log in to continue."
        : "We couldn't load your lessons right now.",
    );
  }

  const body = (await response.json()) as {
    data: T;
  };

  return body.data;
}

async function requestWithBody<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<T> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      errorBody?.message ??
        "We couldn't save your lesson progress.",
    );
  }

  const responseBody = (await response.json()) as {
    data: T;
  };

  return responseBody.data;
}

export function getLearningAreas() {
  return request<LearningArea[]>(
    "/api/learning/areas",
  );
}

export function getCategoryLesson(
  categoryId: string,
) {
  return request<CategoryLesson>(
    `/api/learning/categories/${categoryId}`,
  );
}

export function saveLessonCheckpoint(
  categoryId: string,
  gestureIndex: number,
  lessonStep: LessonStep,
) {
  return requestWithBody<LearningProgress>(
    `/api/learning/categories/${categoryId}/checkpoint`,
    "PATCH",
    {
      gestureIndex,
      lessonStep,
    },
  );
}