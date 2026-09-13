export declare const getMyProgress: (learnerId: string) => Promise<{
    summary: {
        totalCategories: number;
        completedCategories: number;
        inProgressCategories: number;
        assessmentAttempts: number;
    };
    learningAreas: {
        id: string;
        name: string;
        categories: {
            id: string;
            name: string;
            status: import("../generated/prisma/enums.js").CategoryProgressStatus;
            progressPercent: number;
            completedAt: Date | null;
            assessmentAttempts: number;
            latestAssessment: {
                score: number;
                totalPoints: number;
                percentage: number;
                completedAt: Date | null;
            } | null;
        }[];
    }[];
}>;
//# sourceMappingURL=progress.service.d.ts.map