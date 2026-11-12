import { prisma } from "../config/db.js";
import { httpError } from "../utils/httpError.js";

export type LearningStatus = "completed" | "current" | "locked";

/*
 * Lessons unlock one at a time, in order across all learning areas: a finished
 * lesson is completed, the first unfinished one is current, the rest are locked.
 */
export const learningStatuses = (done: boolean[]): LearningStatus[] => {
  let currentFound = false;
  return done.map((isDone) => {
    if (isDone) return "completed";
    if (currentFound) return "locked";
    currentFound = true;
    return "current";
  });
};

export const getLearningAreas = async (learnerId: string) => {
  const [learningAreas, progressRecords] = await Promise.all([
    prisma.learningArea.findMany({
      orderBy: {
        displayOrder: "asc",
      },
      include: {
        categories: {
          where: {
            isActive: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
          include: {
            _count: {
              select: {
                gestures: true,
              },
            },
            assessment: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    }),

    prisma.categoryProgress.findMany({
      where: {
        learnerId,
      },
      select: {
        categoryId: true,
        status: true,
        lastGestureIndex: true,
        lastLessonStep: true,
        startedAt: true,
        completedAt: true,
        lessonCompletedAt: true,
      },
    }),
  ]);

  const progressByCategoryId = new Map(
    progressRecords.map((progress) => [
      progress.categoryId,
      progress,
    ]),
  );

  /*
   * A lesson is done once its quiz and Sign test are passed (COMPLETED). One
   * without a published quiz has nothing to pass, so finishing it is enough;
   * otherwise it would lock every lesson after it.
   */
  const statuses = learningStatuses(
    learningAreas.flatMap((area) =>
      area.categories.map((category) => {
        const progress = progressByCategoryId.get(category.id);
        return (
          progress?.status === "COMPLETED" ||
          (category.assessment?.status !== "PUBLISHED" &&
            progress?.lessonCompletedAt != null)
        );
      }),
    ),
  );
  let lessonIndex = 0;

  return learningAreas.map((area) => ({
    ...area,

    categories: area.categories.map((category) => {
      const progress = progressByCategoryId.get(category.id);

      const rawStatus =
        progress?.status ?? "NOT_STARTED";

      const learningStatus = statuses[lessonIndex++]!;

      /*
       * Count the total signs/gestures
       * inside this category.
       */
      const totalGestures = category._count.gestures;

      /*
       * Calculate actual learning progress.
       *
       * Example:
       *
       * 10 signs total
       * lastGestureIndex = 3
       *
       * (3 + 1) / 10 = 40%
       */
      let progressPercent = 0;

      if (learningStatus === "completed") {
        progressPercent = 100;
      } else if (
        rawStatus === "IN_PROGRESS" &&
        totalGestures > 0
      ) {
        progressPercent = Math.round(
          (((progress?.lastGestureIndex ?? 0) + 1) /
            totalGestures) *
            100,
        );
      }

      /*
       * Make sure the percentage always
       * stays between 0 and 100.
       */
      progressPercent = Math.min(
        100,
        Math.max(0, progressPercent),
      );

      return {
        ...category,

        /*
         * _count is only needed internally
         * for calculating the percentage.
         *
         * Don't send it to the frontend.
         */
        _count: undefined,
        assessment: undefined,

        progress: {
          status: rawStatus,

          lastGestureIndex:
            progress?.lastGestureIndex ?? 0,

          lastLessonStep:
            progress?.lastLessonStep ?? null,

          startedAt:
            progress?.startedAt ?? null,

          completedAt:
            progress?.completedAt ?? null,
        },

        learningStatus,
        progressPercent,
      };
    }),
  }));
};

/** One lesson's place in the learner's chain (practice can still open locked lessons). */
const learningStatusOf = async (categoryId: string, learnerId: string) =>
  (await getLearningAreas(learnerId))
    .flatMap((area) => area.categories)
    .find((category) => category.id === categoryId)?.learningStatus;

export const getCategoryLesson = async (
  categoryId: string,
  learnerId: string,
) => {
  const [
    category,
    categoryGestures,
    progress,
    learningStatus,
  ] = await Promise.all([
    prisma.category.findUnique({
      where: {
        id: categoryId,
        isActive: true,
      },
    }),

    prisma.categoryGesture.findMany({
      where: {
        categoryId,
      },

      /*
       * This is important for Calendar.
       *
       * Calendar is one category containing:
       * 1-12   = January-December
       * 13-19  = Monday-Sunday
       * 20-22  = Today-Yesterday-Tomorrow
       */
      orderBy: {
        displayOrder: "asc",
      },

      include: {
        gesture: true,
      },
    }),

    prisma.categoryProgress.findUnique({
      where: {
        learnerId_categoryId: {
          learnerId,
          categoryId,
        },
      },

      select: {
        status: true,
        lastGestureIndex: true,
        lastLessonStep: true,
        startedAt: true,
        completedAt: true,
      },
    }),

    learningStatusOf(categoryId, learnerId),
  ]);

  if (!category) {
    throw new Error("Category not found.");
  }

  return {
    category,

    learningStatus,

    progress: {
      status:
        progress?.status ?? "NOT_STARTED",

      lastGestureIndex:
        progress?.lastGestureIndex ?? 0,

      lastLessonStep:
        progress?.lastLessonStep ?? null,

      startedAt:
        progress?.startedAt ?? null,

      completedAt:
        progress?.completedAt ?? null,
    },

    categoryGestures,
  };
};

export const saveLessonCheckpoint = async (
  categoryId: string,
  learnerId: string,
  gestureIndex: number,
  lessonStep:
    | "meaning"
    | "context"
    | "how"
    | "try",
) => {
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
        isActive: true,
      },

      include: {
        gestures: {
          orderBy: {
            displayOrder: "asc",
          },
        },
        assessment: {
          select: {
            status: true,
          },
        },
      },
    });

  if (!category) {
    throw new Error("Category not found.");
  }

  if (category.gestures.length === 0) {
    throw new Error(
      "This category has no lessons yet.",
    );
  }

  // The Learn page hides locked lessons; this stops a direct link from finishing one anyway.
  if ((await learningStatusOf(categoryId, learnerId)) === "locked") {
    throw httpError(403, "Finish the lessons before this one first.");
  }

  if (
    gestureIndex < 0 ||
    gestureIndex >= category.gestures.length
  ) {
    throw new Error(
      "Invalid lesson position.",
    );
  }

  /*
   * The learner has finished this category's lesson
   * once they reach the final gesture's final step.
   *
   * This unlocks the category's assessment. Once set,
   * lessonCompletedAt is never cleared back to null on
   * later checkpoint saves (e.g. navigating backward
   * to review earlier steps).
   */
  const isFinalStep =
    gestureIndex === category.gestures.length - 1 &&
    lessonStep === "try";

  const existingProgress =
    await prisma.categoryProgress.findUnique({
      where: {
        learnerId_categoryId: {
          learnerId,
          categoryId,
        },
      },

      select: {
        status: true,
      },
    });

  /*
   * Reviewing a category that's already COMPLETED (e.g. the
   * learner revisits it after passing the assessment) must not
   * regress its status back to IN_PROGRESS — doing so would make
   * the learn page treat it as the active category again and
   * re-lock everything that comes after it.
   */
  const isAlreadyCompleted =
    existingProgress?.status === "COMPLETED";

  /*
   * With no published quiz there's nothing left to pass, so finishing the
   * lesson completes it (stored, so publishing a quiz later can't re-lock
   * the lessons after it).
   */
  const completesLesson =
    isFinalStep &&
    category.assessment?.status !== "PUBLISHED";
  const statusUpdate = completesLesson
    ? { status: "COMPLETED" as const, completedAt: new Date() }
    : { status: "IN_PROGRESS" as const };

  const progress =
    await prisma.categoryProgress.upsert({
      where: {
        learnerId_categoryId: {
          learnerId,
          categoryId,
        },
      },

      update: {
        ...(isAlreadyCompleted
          ? {}
          : statusUpdate),

        lastGestureIndex:
          gestureIndex,

        lastLessonStep:
          lessonStep,

        ...(isFinalStep
          ? { lessonCompletedAt: new Date() }
          : {}),
      },

      create: {
        learnerId,
        categoryId,

        ...statusUpdate,

        lastGestureIndex:
          gestureIndex,

        lastLessonStep:
          lessonStep,

        startedAt: new Date(),

        ...(isFinalStep
          ? { lessonCompletedAt: new Date() }
          : {}),
      },
    });

  return progress;
};