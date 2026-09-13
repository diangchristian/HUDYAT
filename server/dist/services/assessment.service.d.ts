export declare const checkAnswer: (categoryId: string, learnerId: string, questionId: string, selectedChoiceId: string) => Promise<{
    isCorrect: boolean;
    correctChoiceId: string | null;
}>;
export declare const getAssessmentByCategory: (categoryId: string, learnerId: string) => Promise<{
    id: string;
    title: string;
    description: string | null;
    passingScore: import("@prisma/client-runtime-utils").Decimal;
    category: {
        description: string | null;
        displayOrder: number;
        id: string;
        learningAreaId: string;
        name: string;
    };
    questions: {
        id: string;
        questionNumber: number;
        questionText: string;
        questionType: import("../generated/prisma/enums.js").AssessmentQuestionType;
        referenceMediaUrl: string | null;
        gesture: {
            id: string;
            label: string;
            referenceImageUrl: string | null;
            referenceVideoUrl: string | null;
        };
        points: import("@prisma/client-runtime-utils").Decimal;
        choices: {
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
        }[];
    }[];
    previousAttempt: {
        id: string;
        score: import("@prisma/client-runtime-utils").Decimal;
        totalPoints: import("@prisma/client-runtime-utils").Decimal;
        completedAt: Date | null;
    } | null;
}>;
export declare const submitAssessment: (categoryId: string, learnerId: string, answers: Array<{
    questionId: string;
    selectedChoiceId: string;
}>) => Promise<{
    attemptId: string;
    score: import("@prisma/client-runtime-utils").Decimal;
    totalPoints: import("@prisma/client-runtime-utils").Decimal;
    percentage: import("@prisma/client-runtime-utils").Decimal;
    passingScore: import("@prisma/client-runtime-utils").Decimal;
    passed: boolean;
    answers: {
        questionId: string;
        selectedChoiceId: string;
        isCorrect: boolean;
        pointsEarned: import("@prisma/client-runtime-utils").Decimal;
    }[];
}>;
export declare const getAssessmentsForLearner: (learnerId: string) => Promise<{
    learningAreas: {
        id: string;
        name: string;
        categories: {
            isUnlocked: boolean;
            lockedReason: string | null;
            status: 'completed' | 'not-started' | 'locked';
            categoryId: string;
            categoryName: string;
            assessmentId: string | null;
            title: string;
            description: string | null;
            totalQuestions: number;
            attemptCount: number;
            latestAttempt: {
                score: import("@prisma/client-runtime-utils").Decimal;
                totalPoints: import("@prisma/client-runtime-utils").Decimal;
                percentage: import("@prisma/client-runtime-utils").Decimal;
                passed: boolean;
                completedAt: Date | null;
            } | null;
        }[];
    }[];
}>;
//# sourceMappingURL=assessment.service.d.ts.map