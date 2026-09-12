import { prisma } from "../config/db.js";

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
      },
    }),
  ]);

  const progressByCategoryId = new Map(
    progressRecords.map((progress) => [
      progress.categoryId,
      progress,
    ]),
  );

  let currentCategoryFound = false;

  return learningAreas.map((area) => ({
    ...area,

    categories: area.categories.map((category) => {
      const progress = progressByCategoryId.get(category.id);

      const rawStatus =
        progress?.status ?? "NOT_STARTED";

      /*
       * Determine how the category should
       * appear on the Learn page.
       */
      let learningStatus:
        | "completed"
        | "current"
        | "locked";

      if (rawStatus === "COMPLETED") {
        learningStatus = "completed";
      } else if (rawStatus === "IN_PROGRESS") {
        learningStatus = "current";
        currentCategoryFound = true;
      } else if (!currentCategoryFound) {
        learningStatus = "current";
        currentCategoryFound = true;
      } else {
        learningStatus = "locked";
      }

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

      if (rawStatus === "COMPLETED") {
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

export const getCategoryLesson = async (
  categoryId: string,
  learnerId: string,
) => {
  const [
    category,
    categoryGestures,
    progress,
  ] = await Promise.all([
    prisma.category.findUnique({
      where: {
        id: categoryId,
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
  ]);

  return {
    category,

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
      },

      include: {
        gestures: {
          orderBy: {
            displayOrder: "asc",
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
          : { status: "IN_PROGRESS" }),

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

        status: "IN_PROGRESS",

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