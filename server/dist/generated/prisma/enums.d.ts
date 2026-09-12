export declare const UserRole: {
    readonly ADMIN: 'ADMIN';
    readonly TEACHER: 'TEACHER';
    readonly LEARNER: 'LEARNER';
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const AssessmentStatus: {
    readonly DRAFT: 'DRAFT';
    readonly PUBLISHED: 'PUBLISHED';
    readonly ARCHIVED: 'ARCHIVED';
};
export type AssessmentStatus = (typeof AssessmentStatus)[keyof typeof AssessmentStatus];
export declare const AssessmentQuestionType: {
    readonly IMAGE_GESTURE: 'IMAGE_GESTURE';
    readonly VIDEO_GESTURE: 'VIDEO_GESTURE';
};
export type AssessmentQuestionType = (typeof AssessmentQuestionType)[keyof typeof AssessmentQuestionType];
export declare const CategoryProgressStatus: {
    readonly NOT_STARTED: 'NOT_STARTED';
    readonly IN_PROGRESS: 'IN_PROGRESS';
    readonly COMPLETED: 'COMPLETED';
};
export type CategoryProgressStatus = (typeof CategoryProgressStatus)[keyof typeof CategoryProgressStatus];
//# sourceMappingURL=enums.d.ts.map