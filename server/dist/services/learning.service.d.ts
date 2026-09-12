export declare const getLearningAreas: (learnerId: string) => Promise<{
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    categories: {
        modelRelease: import("@prisma/client/runtime/client").JsonValue | null;
        id: string;
        learningAreaId: string;
        name: string;
        description: string | null;
        displayOrder: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: undefined;
        progress: {
            status: import("../generated/prisma/enums.js").CategoryProgressStatus;
            lastGestureIndex: number;
            lastLessonStep: string | null;
            startedAt: Date | null;
            completedAt: Date | null;
        };
        learningStatus: "completed" | "current" | "locked";
        progressPercent: number;
    }[];
}[]>;
export declare const getCategoryLesson: (categoryId: string, learnerId: string) => Promise<{
    category: {
        modelRelease: import("@prisma/client/runtime/client").JsonValue | null;
        id: string;
        learningAreaId: string;
        name: string;
        description: string | null;
        displayOrder: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    progress: {
        status: import("../generated/prisma/enums.js").CategoryProgressStatus;
        lastGestureIndex: number;
        lastLessonStep: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
    };
    categoryGestures: ({
        gesture: {
            id: string;
            label: string;
            meaning: string | null;
            modelClass: string;
            referenceImageUrl: string | null;
            referenceVideoUrl: string | null;
            isValidated: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        categoryId: string;
        gestureId: string;
        exampleUsage: string | null;
        displayOrder: number;
        createdAt: Date;
    })[];
}>;
export declare const saveLessonCheckpoint: (categoryId: string, learnerId: string, gestureIndex: number, lessonStep: "meaning" | "context" | "how" | "try") => Promise<{
    id: string;
    learnerId: string;
    categoryId: string;
    status: import("../generated/prisma/enums.js").CategoryProgressStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastGestureIndex: number;
    lastLessonStep: string | null;
    lessonCompletedAt: Date | null;
}>;
//# sourceMappingURL=learning.service.d.ts.map