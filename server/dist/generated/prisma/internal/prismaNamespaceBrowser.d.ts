import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: 'User';
    readonly LearnerProfile: 'LearnerProfile';
    readonly TeacherProfile: 'TeacherProfile';
    readonly LearningArea: 'LearningArea';
    readonly Category: 'Category';
    readonly FslGesture: 'FslGesture';
    readonly CategoryGesture: 'CategoryGesture';
    readonly Assessment: 'Assessment';
    readonly AssessmentQuestion: 'AssessmentQuestion';
    readonly QuestionChoice: 'QuestionChoice';
    readonly AssessmentAttempt: 'AssessmentAttempt';
    readonly AssessmentAnswer: 'AssessmentAnswer';
    readonly PracticeSession: 'PracticeSession';
    readonly CategoryProgress: 'CategoryProgress';
    readonly SystemSetting: 'SystemSetting';
    readonly AuditLog: 'AuditLog';
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: 'ReadUncommitted';
    readonly ReadCommitted: 'ReadCommitted';
    readonly RepeatableRead: 'RepeatableRead';
    readonly Serializable: 'Serializable';
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: 'id';
    readonly username: 'username';
    readonly email: 'email';
    readonly password: 'password';
    readonly loginCode: 'loginCode';
    readonly role: 'role';
    readonly isActive: 'isActive';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const LearnerProfileScalarFieldEnum: {
    readonly userId: 'userId';
    readonly fullName: 'fullName';
    readonly avatarKey: 'avatarKey';
    readonly dateJoined: 'dateJoined';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type LearnerProfileScalarFieldEnum = (typeof LearnerProfileScalarFieldEnum)[keyof typeof LearnerProfileScalarFieldEnum];
export declare const TeacherProfileScalarFieldEnum: {
    readonly userId: 'userId';
    readonly fullName: 'fullName';
    readonly email: 'email';
    readonly contactNumber: 'contactNumber';
    readonly dateJoined: 'dateJoined';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type TeacherProfileScalarFieldEnum = (typeof TeacherProfileScalarFieldEnum)[keyof typeof TeacherProfileScalarFieldEnum];
export declare const LearningAreaScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly description: 'description';
    readonly displayOrder: 'displayOrder';
    readonly isActive: 'isActive';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type LearningAreaScalarFieldEnum = (typeof LearningAreaScalarFieldEnum)[keyof typeof LearningAreaScalarFieldEnum];
export declare const CategoryScalarFieldEnum: {
    readonly modelRelease: 'modelRelease';
    readonly id: 'id';
    readonly learningAreaId: 'learningAreaId';
    readonly name: 'name';
    readonly description: 'description';
    readonly displayOrder: 'displayOrder';
    readonly isActive: 'isActive';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum];
export declare const FslGestureScalarFieldEnum: {
    readonly id: 'id';
    readonly label: 'label';
    readonly meaning: 'meaning';
    readonly modelClass: 'modelClass';
    readonly referenceImageUrl: 'referenceImageUrl';
    readonly referenceVideoUrl: 'referenceVideoUrl';
    readonly isValidated: 'isValidated';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type FslGestureScalarFieldEnum = (typeof FslGestureScalarFieldEnum)[keyof typeof FslGestureScalarFieldEnum];
export declare const CategoryGestureScalarFieldEnum: {
    readonly id: 'id';
    readonly categoryId: 'categoryId';
    readonly gestureId: 'gestureId';
    readonly exampleUsage: 'exampleUsage';
    readonly displayOrder: 'displayOrder';
    readonly createdAt: 'createdAt';
};
export type CategoryGestureScalarFieldEnum = (typeof CategoryGestureScalarFieldEnum)[keyof typeof CategoryGestureScalarFieldEnum];
export declare const AssessmentScalarFieldEnum: {
    readonly id: 'id';
    readonly categoryId: 'categoryId';
    readonly createdBy: 'createdBy';
    readonly title: 'title';
    readonly description: 'description';
    readonly passingScore: 'passingScore';
    readonly status: 'status';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type AssessmentScalarFieldEnum = (typeof AssessmentScalarFieldEnum)[keyof typeof AssessmentScalarFieldEnum];
export declare const AssessmentQuestionScalarFieldEnum: {
    readonly id: 'id';
    readonly assessmentId: 'assessmentId';
    readonly gestureId: 'gestureId';
    readonly questionNumber: 'questionNumber';
    readonly questionText: 'questionText';
    readonly questionType: 'questionType';
    readonly referenceMediaUrl: 'referenceMediaUrl';
    readonly points: 'points';
    readonly createdAt: 'createdAt';
};
export type AssessmentQuestionScalarFieldEnum = (typeof AssessmentQuestionScalarFieldEnum)[keyof typeof AssessmentQuestionScalarFieldEnum];
export declare const QuestionChoiceScalarFieldEnum: {
    readonly id: 'id';
    readonly questionId: 'questionId';
    readonly gestureId: 'gestureId';
    readonly choiceText: 'choiceText';
    readonly imageUrl: 'imageUrl';
    readonly displayOrder: 'displayOrder';
};
export type QuestionChoiceScalarFieldEnum = (typeof QuestionChoiceScalarFieldEnum)[keyof typeof QuestionChoiceScalarFieldEnum];
export declare const AssessmentAttemptScalarFieldEnum: {
    readonly id: 'id';
    readonly assessmentId: 'assessmentId';
    readonly learnerId: 'learnerId';
    readonly score: 'score';
    readonly totalPoints: 'totalPoints';
    readonly startedAt: 'startedAt';
    readonly completedAt: 'completedAt';
};
export type AssessmentAttemptScalarFieldEnum = (typeof AssessmentAttemptScalarFieldEnum)[keyof typeof AssessmentAttemptScalarFieldEnum];
export declare const AssessmentAnswerScalarFieldEnum: {
    readonly id: 'id';
    readonly attemptId: 'attemptId';
    readonly questionId: 'questionId';
    readonly selectedChoiceId: 'selectedChoiceId';
    readonly isCorrect: 'isCorrect';
    readonly pointsEarned: 'pointsEarned';
    readonly answeredAt: 'answeredAt';
};
export type AssessmentAnswerScalarFieldEnum = (typeof AssessmentAnswerScalarFieldEnum)[keyof typeof AssessmentAnswerScalarFieldEnum];
export declare const PracticeSessionScalarFieldEnum: {
    readonly id: 'id';
    readonly learnerId: 'learnerId';
    readonly gestureId: 'gestureId';
    readonly recognizedLabel: 'recognizedLabel';
    readonly confidence: 'confidence';
    readonly isCorrect: 'isCorrect';
    readonly attemptedAt: 'attemptedAt';
};
export type PracticeSessionScalarFieldEnum = (typeof PracticeSessionScalarFieldEnum)[keyof typeof PracticeSessionScalarFieldEnum];
export declare const CategoryProgressScalarFieldEnum: {
    readonly id: 'id';
    readonly learnerId: 'learnerId';
    readonly categoryId: 'categoryId';
    readonly status: 'status';
    readonly startedAt: 'startedAt';
    readonly completedAt: 'completedAt';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
    readonly lastGestureIndex: 'lastGestureIndex';
    readonly lastLessonStep: 'lastLessonStep';
    readonly lessonCompletedAt: 'lessonCompletedAt';
};
export type CategoryProgressScalarFieldEnum = (typeof CategoryProgressScalarFieldEnum)[keyof typeof CategoryProgressScalarFieldEnum];
export declare const SystemSettingScalarFieldEnum: {
    readonly id: 'id';
    readonly systemName: 'systemName';
    readonly systemVersion: 'systemVersion';
    readonly schoolName: 'schoolName';
    readonly unitName: 'unitName';
    readonly logoUrl: 'logoUrl';
    readonly defaultLanguage: 'defaultLanguage';
    readonly maintenanceMode: 'maintenanceMode';
    readonly updatedBy: 'updatedBy';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type SystemSettingScalarFieldEnum = (typeof SystemSettingScalarFieldEnum)[keyof typeof SystemSettingScalarFieldEnum];
export declare const AuditLogScalarFieldEnum: {
    readonly id: 'id';
    readonly userId: 'userId';
    readonly action: 'action';
    readonly entityType: 'entityType';
    readonly entityId: 'entityId';
    readonly description: 'description';
    readonly createdAt: 'createdAt';
};
export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: 'asc';
    readonly desc: 'desc';
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const QueryMode: {
    readonly default: 'default';
    readonly insensitive: 'insensitive';
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: 'first';
    readonly last: 'last';
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map