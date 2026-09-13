/** Categories arrive in learning-area/category display order. */
export declare function assessmentAccess(items: readonly {
    passed: boolean;
    published: boolean;
    questionCount: number;
}[]): {
    isUnlocked: boolean;
    lockedReason: string | null;
    status: 'completed' | 'not-started' | 'locked';
}[];
//# sourceMappingURL=assessment-access.d.ts.map