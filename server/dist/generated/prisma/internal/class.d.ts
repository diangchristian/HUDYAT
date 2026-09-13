import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace.js";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
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
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.PrismaClientConstructorArgs<Options>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
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
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = Prisma.PrismaClientOptions['omit'], in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    /**
     * Connect with the database
     */
    $connect(): runtime.Types.Utils.JsPromise<void>;
    /**
     * Disconnect from the database
     */
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    /**
       * Executes a prepared raw query and returns the number of affected rows.
       * @example
       * ```
       * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
       * ```
       *
       * Read more in our [docs](https://pris.ly/d/raw-queries).
       */
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Executes a raw query and returns the number of affected rows.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Performs a prepared raw query and returns the `SELECT` data.
     * @example
     * ```
     * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Performs a raw query and returns the `SELECT` data.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
     * @example
     * ```
     * const [george, bob, alice] = await prisma.$transaction([
     *   prisma.user.create({ data: { name: 'George' } }),
     *   prisma.user.create({ data: { name: 'Bob' } }),
     *   prisma.user.create({ data: { name: 'Alice' } }),
     * ])
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
     */
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    /**
 * `prisma.user`: Exposes CRUD operations for the **User** model.
  * Example usage:
  * ```ts
  * // Fetch zero or more Users
  * const users = await prisma.user.findMany()
  * ```
  */
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.learnerProfile`: Exposes CRUD operations for the **LearnerProfile** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more LearnerProfiles
      * const learnerProfiles = await prisma.learnerProfile.findMany()
      * ```
      */
    get learnerProfile(): Prisma.LearnerProfileDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.teacherProfile`: Exposes CRUD operations for the **TeacherProfile** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more TeacherProfiles
      * const teacherProfiles = await prisma.teacherProfile.findMany()
      * ```
      */
    get teacherProfile(): Prisma.TeacherProfileDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.learningArea`: Exposes CRUD operations for the **LearningArea** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more LearningAreas
      * const learningAreas = await prisma.learningArea.findMany()
      * ```
      */
    get learningArea(): Prisma.LearningAreaDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.category`: Exposes CRUD operations for the **Category** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Categories
      * const categories = await prisma.category.findMany()
      * ```
      */
    get category(): Prisma.CategoryDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.fslGesture`: Exposes CRUD operations for the **FslGesture** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more FslGestures
      * const fslGestures = await prisma.fslGesture.findMany()
      * ```
      */
    get fslGesture(): Prisma.FslGestureDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.categoryGesture`: Exposes CRUD operations for the **CategoryGesture** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more CategoryGestures
      * const categoryGestures = await prisma.categoryGesture.findMany()
      * ```
      */
    get categoryGesture(): Prisma.CategoryGestureDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.assessment`: Exposes CRUD operations for the **Assessment** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Assessments
      * const assessments = await prisma.assessment.findMany()
      * ```
      */
    get assessment(): Prisma.AssessmentDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.assessmentQuestion`: Exposes CRUD operations for the **AssessmentQuestion** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AssessmentQuestions
      * const assessmentQuestions = await prisma.assessmentQuestion.findMany()
      * ```
      */
    get assessmentQuestion(): Prisma.AssessmentQuestionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.questionChoice`: Exposes CRUD operations for the **QuestionChoice** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more QuestionChoices
      * const questionChoices = await prisma.questionChoice.findMany()
      * ```
      */
    get questionChoice(): Prisma.QuestionChoiceDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.assessmentAttempt`: Exposes CRUD operations for the **AssessmentAttempt** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AssessmentAttempts
      * const assessmentAttempts = await prisma.assessmentAttempt.findMany()
      * ```
      */
    get assessmentAttempt(): Prisma.AssessmentAttemptDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.assessmentAnswer`: Exposes CRUD operations for the **AssessmentAnswer** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AssessmentAnswers
      * const assessmentAnswers = await prisma.assessmentAnswer.findMany()
      * ```
      */
    get assessmentAnswer(): Prisma.AssessmentAnswerDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.practiceSession`: Exposes CRUD operations for the **PracticeSession** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PracticeSessions
      * const practiceSessions = await prisma.practiceSession.findMany()
      * ```
      */
    get practiceSession(): Prisma.PracticeSessionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.categoryProgress`: Exposes CRUD operations for the **CategoryProgress** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more CategoryProgresses
      * const categoryProgresses = await prisma.categoryProgress.findMany()
      * ```
      */
    get categoryProgress(): Prisma.CategoryProgressDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.systemSetting`: Exposes CRUD operations for the **SystemSetting** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more SystemSettings
      * const systemSettings = await prisma.systemSetting.findMany()
      * ```
      */
    get systemSetting(): Prisma.SystemSettingDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.auditLog`: Exposes CRUD operations for the **AuditLog** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more AuditLogs
      * const auditLogs = await prisma.auditLog.findMany()
      * ```
      */
    get auditLog(): Prisma.AuditLogDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
//# sourceMappingURL=class.d.ts.map