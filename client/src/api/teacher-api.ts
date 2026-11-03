import axios from "axios";

import { api, unwrap } from "./http";
import type { MyProgress } from "./progress-api";

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionType = "IMAGE_GESTURE" | "VIDEO_GESTURE";

export type AttemptSummary = {
  id: string;
  learnerId: string;
  learnerName: string;
  categoryId: string;
  categoryName: string;
  assessmentTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
};

export type TeacherDashboard = {
  learnerCount: number;
  /** Learners who have started or finished at least one lesson. */
  activeLearnerCount: number;
  categoryCount: number;
  /** Mean percentage across all completed quiz attempts; null if none. */
  averageQuizScore: number | null;
  /** Distinct learners with a practice attempt since local midnight. */
  practicedTodayCount: number;
  assessments: { published: number; draft: number; archived: number };
  recentAttempts: AttemptSummary[];
};

export type AssessmentListArea = {
  id: string;
  name: string;
  categories: Array<{
    categoryId: string;
    categoryName: string;
    categoryDescription: string | null;
    categoryUpdatedAt: string;
    gestureCount: number;
    assessment: {
      id: string;
      title: string;
      status: AssessmentStatus;
      passingScore: number;
      questionCount: number;
      attemptCount: number;
      updatedAt: string;
    } | null;
  }>;
};

export type Gesture = {
  id: string;
  label: string;
  meaning: string | null;
  referenceImageUrl: string | null;
  referenceVideoUrl: string | null;
};

export type AuthoringQuestion = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: QuestionType;
  points: number;
  gesture: Gesture;
  choices: Array<{
    id: string;
    choiceText: string | null;
    displayOrder: number;
    gesture: Gesture;
    isCorrect: boolean;
  }>;
};

export type AuthoringAssessment = {
  category: {
    id: string;
    name: string;
    description: string | null;
    learningArea: { id: string; name: string };
  };
  assessment: {
    id: string;
    title: string;
    description: string | null;
    passingScore: number;
    status: AssessmentStatus;
    attemptCount: number;
    isLocked: boolean;
    updatedAt: string;
    questions: AuthoringQuestion[];
  } | null;
};

export type AssessmentInput = {
  title?: string;
  description?: string | null;
  passingScore?: number;
  status?: AssessmentStatus;
};

/*
 * The correct answer is the choice whose gesture is `gestureId`, so
 * `choiceGestureIds` must include it.
 */
export type QuestionInput = {
  questionText?: string;
  questionType?: QuestionType;
  points?: number;
  gestureId?: string;
  choiceGestureIds?: string[];
};

export type LearnerSummary = {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  avatarKey: string | null;
  isActive: boolean;
  dateJoined: string;
  totalCategories: number;
  completedCategories: number;
  inProgressCategories: number;
  assessmentAttempts: number;
  lastActivityAt: string | null;
};

export type LearnerDetail = {
  learner: Omit<
    LearnerSummary,
    | "totalCategories"
    | "completedCategories"
    | "inProgressCategories"
    | "assessmentAttempts"
    | "lastActivityAt"
  >;
  progress: MyProgress;
  attempts: AttemptSummary[];
  practice: {
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
  };
};

export type EditableSign = {
  id: string;
  label: string;
  meaning: string | null;
  exampleUsage: string | null;
  referenceImageUrl: string | null;
  referenceVideoUrl: string | null;
};

export type EditableLesson = {
  id: string;
  name: string;
  description: string | null;
  areaName: string;
  signs: EditableSign[];
};

export type LessonContentInput = {
  description: string;
  signs: Array<Omit<EditableSign, "label">>;
};

const assessmentPath = (categoryId: string) =>
  `/api/teacher/categories/${categoryId}/assessment`;

export function getTeacherDashboard(signal?: AbortSignal) {
  return unwrap<TeacherDashboard>(
    api.get("/api/teacher/dashboard", { signal }),
  );
}

export function getTeacherAssessments(signal?: AbortSignal) {
  return unwrap<AssessmentListArea[]>(
    api.get("/api/teacher/assessments", { signal }),
  );
}

export function getTeacherAssessment(categoryId: string, signal?: AbortSignal) {
  return unwrap<AuthoringAssessment>(
    api.get(assessmentPath(categoryId), { signal }),
  );
}

export function getCategoryGestures(categoryId: string, signal?: AbortSignal) {
  return unwrap<Gesture[]>(
    api.get(`/api/teacher/categories/${categoryId}/gestures`, { signal }),
  );
}

export function saveAssessment(categoryId: string, data: AssessmentInput) {
  return unwrap<AuthoringAssessment>(api.put(assessmentPath(categoryId), data));
}

export function createQuestion(categoryId: string, data: QuestionInput) {
  return unwrap<AuthoringAssessment>(
    api.post(`${assessmentPath(categoryId)}/questions`, data),
  );
}

export function updateQuestion(
  categoryId: string,
  questionId: string,
  data: QuestionInput,
) {
  return unwrap<AuthoringAssessment>(
    api.patch(`${assessmentPath(categoryId)}/questions/${questionId}`, data),
  );
}

export function deleteQuestion(categoryId: string, questionId: string) {
  return unwrap<AuthoringAssessment>(
    api.delete(`${assessmentPath(categoryId)}/questions/${questionId}`),
  );
}

export function getLearners(signal?: AbortSignal) {
  return unwrap<LearnerSummary[]>(api.get("/api/teacher/learners", { signal }));
}

export function getTeacherLesson(categoryId: string, signal?: AbortSignal) {
  return unwrap<EditableLesson>(
    api.get(`/api/teacher/lessons/${categoryId}`, { signal }),
  );
}

export function updateTeacherLesson(
  categoryId: string,
  data: LessonContentInput,
) {
  return unwrap<EditableLesson>(
    api.patch(`/api/teacher/lessons/${categoryId}`, data),
  );
}

export type MediaKind = "image" | "video";

/**
 * Sends a file straight to Cloudinary with a permission signed by our server,
 * and returns where learners will load it from.
 */
export async function uploadLessonMedia(
  file: File,
  onProgress: (percent: number) => void,
) {
  const kind: MediaKind = file.type.startsWith("video/") ? "video" : "image";

  const { uploadUrl, fields } = await unwrap<{
    uploadUrl: string;
    fields: Record<string, string | number>;
  }>(api.post("/api/teacher/media/signature", { kind }));

  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    form.append(name, String(value));
  }
  form.append("file", file);

  try {
    // Plain axios, not `api`: our login token must never be sent to Cloudinary.
    const { data } = await axios.post<{ secure_url: string }>(uploadUrl, form, {
      onUploadProgress: ({ progress }) =>
        onProgress(Math.round((progress ?? 0) * 100)),
    });

    return {
      kind,
      // Changing the extension makes Cloudinary serve MP4, which plays on every browser.
      url:
        kind === "video"
          ? data.secure_url.replace(/\.[^.]+$/, ".mp4")
          : data.secure_url,
    };
  } catch (error) {
    throw new Error("The upload didn't finish. Check your connection and try again.", {
      cause: error,
    });
  }
}

export function createLearner(data: {
  fullName: string;
  username: string;
  password: string;
}) {
  return unwrap<{ id: string; fullName: string; username: string }>(
    api.post("/api/teacher/learners", data),
  );
}

export function resetLearnerPassword(learnerId: string, password: string) {
  return unwrap<{ id: string }>(
    api.post(`/api/teacher/learners/${learnerId}/reset-password`, { password }),
  );
}

export function setLearnerStatus(learnerId: string, isActive: boolean) {
  return unwrap<{ id: string; isActive: boolean }>(
    api.patch(`/api/teacher/learners/${learnerId}/status`, { isActive }),
  );
}

export function getLearnerDetail(learnerId: string, signal?: AbortSignal) {
  return unwrap<LearnerDetail>(
    api.get(`/api/teacher/learners/${learnerId}`, { signal }),
  );
}
