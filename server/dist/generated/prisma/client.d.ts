import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class.js";
import * as Prisma from "./internal/prismaNamespace.js";
export * as $Enums from './enums.js';
export * from "./enums.js";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model LearnerProfile
 *
 */
export type LearnerProfile = Prisma.LearnerProfileModel;
/**
 * Model TeacherProfile
 *
 */
export type TeacherProfile = Prisma.TeacherProfileModel;
/**
 * Model LearningArea
 *
 */
export type LearningArea = Prisma.LearningAreaModel;
/**
 * Model Category
 *
 */
export type Category = Prisma.CategoryModel;
/**
 * Model FslGesture
 *
 */
export type FslGesture = Prisma.FslGestureModel;
/**
 * Model CategoryGesture
 *
 */
export type CategoryGesture = Prisma.CategoryGestureModel;
/**
 * Model Assessment
 *
 */
export type Assessment = Prisma.AssessmentModel;
/**
 * Model AssessmentQuestion
 *
 */
export type AssessmentQuestion = Prisma.AssessmentQuestionModel;
/**
 * Model QuestionChoice
 *
 */
export type QuestionChoice = Prisma.QuestionChoiceModel;
/**
 * Model AssessmentAttempt
 *
 */
export type AssessmentAttempt = Prisma.AssessmentAttemptModel;
/**
 * Model AssessmentAnswer
 *
 */
export type AssessmentAnswer = Prisma.AssessmentAnswerModel;
/**
 * Model PracticeSession
 *
 */
export type PracticeSession = Prisma.PracticeSessionModel;
/**
 * Model CategoryProgress
 *
 */
export type CategoryProgress = Prisma.CategoryProgressModel;
/**
 * Model SystemSetting
 *
 */
export type SystemSetting = Prisma.SystemSettingModel;
/**
 * Model AuditLog
 *
 */
export type AuditLog = Prisma.AuditLogModel;
//# sourceMappingURL=client.d.ts.map