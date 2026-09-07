import { api, unwrap } from "./http";

export type AssessmentChoice = {
  id: string;
  choiceText: string | null;
  imageUrl: string | null;
  displayOrder: number;
  gesture: {
    id: string;
    label: string;
    referenceImageUrl: string | null;
    referenceVideoUrl: string | null;
  };
};

export type AssessmentQuestion = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: "IMAGE_GESTURE" | "VIDEO_GESTURE";
  referenceMediaUrl: string | null;
  points: string;
  choices: AssessmentChoice[];
};

export type AssessmentData = {
  id: string;
  title: string;
  description: string | null;
  passingScore: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  };
  questions: AssessmentQuestion[];
};

export type AssessmentAnswer = {
  questionId: string;
  selectedChoiceId: string;
};

export type AssessmentResult = {
  attemptId: string;
  score: string;
  totalPoints: string;
  percentage: string;
  passingScore: string;
  passed: boolean;
  answers: Array<{
    questionId: string;
    selectedChoiceId: string;
    isCorrect: boolean;
    pointsEarned: string;
  }>;
};

export type AssessmentListStatus = "locked" | "not-started" | "completed";

export type AssessmentListCategory = {
  categoryId: string;
  categoryName: string;
  assessmentId: string;
  title: string;
  description: string | null;
  totalQuestions: number;
  isUnlocked: boolean;
  attemptCount: number;
  latestAttempt: {
    score: string;
    totalPoints: string;
    percentage: string;
    passed: boolean;
    completedAt: string;
  } | null;
  status: AssessmentListStatus;
};

export type AssessmentListResponse = {
  learningAreas: Array<{
    id: string;
    name: string;
    categories: AssessmentListCategory[];
  }>;
};

export type CheckAnswerResult = {
  isCorrect: boolean;
  correctChoiceId: string | null;
};

export function getAssessment(categoryId: string) {
  return unwrap<AssessmentData>(
    api.get(`/api/assessments/categories/${categoryId}`),
  );
}

export function checkAnswer(
  categoryId: string,
  questionId: string,
  selectedChoiceId: string,
) {
  return unwrap<CheckAnswerResult>(
    api.post(
      `/api/assessments/categories/${categoryId}/questions/${questionId}/check`,
      { selectedChoiceId },
    ),
  );
}

export function submitAssessment(
  categoryId: string,
  answers: AssessmentAnswer[],
) {
  return unwrap<AssessmentResult>(
    api.post(`/api/assessments/categories/${categoryId}/submit`, {
      answers,
    }),
  );
}

export function getAssessmentList() {
  return unwrap<AssessmentListResponse>(api.get("/api/assessments"));
}
