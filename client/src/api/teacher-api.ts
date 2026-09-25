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
  referenceMediaUrl: string | null;
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
  referenceMediaUrl?: string | null;
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

export function getLearnerDetail(learnerId: string, signal?: AbortSignal) {
  return unwrap<LearnerDetail>(
    api.get(`/api/teacher/learners/${learnerId}`, { signal }),
  );
}
