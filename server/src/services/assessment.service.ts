import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/db.js";

/*
 * A category's assessment unlocks for a learner once they've
 * finished that category's lesson content (or already passed
 * the assessment before, e.g. a retake).
 */
const assertLessonIsUnlocked = async (
  categoryId: string,
  learnerId: string,
) => {
  const categoryProgress =
    await prisma.categoryProgress.findUnique({
      where: {
        learnerId_categoryId: {
          learnerId,
          categoryId,
        },
      },
      select: {
        lessonCompletedAt: true,
        status: true,
      },
    });

  const isUnlocked =
    categoryProgress?.lessonCompletedAt != null ||
    categoryProgress?.status === "COMPLETED";

  if (!isUnlocked) {
    const error = new Error(
      "Finish this category's lesson before taking its assessment.",
    ) as Error & { statusCode?: number };

    error.statusCode = 403;

    throw error;
  }
};

/*
 * Checks a single question's selected choice on demand, so the
 * learner can get instant right/wrong feedback while taking the
 * assessment. This never reveals the full answer key up front —
 * only the correctness of the choice they already picked, plus
 * which choice was correct so the UI can highlight it.
 *
 * The final score is still authoritatively (re)computed by
 * `submitAssessment`, which does not trust this endpoint's result.
 */
export const checkAnswer = async (
  categoryId: string,
  learnerId: string,
  questionId: string,
  selectedChoiceId: string,
) => {
  const assessment = await prisma.assessment.findUnique({
    where: {
      categoryId,
    },
  });

  if (!assessment) {
    throw new Error("Assessment not found for this category.");
  }

  if (assessment.status !== "PUBLISHED") {
    throw new Error("This assessment is not available yet.");
  }

  await assertLessonIsUnlocked(categoryId, learnerId);

  const question = await prisma.assessmentQuestion.findFirst({
    where: {
      id: questionId,
      assessmentId: assessment.id,
    },
    include: {
      choices: true,
    },
  });

  if (!question) {
    throw new Error("Question not found for this assessment.");
  }

  const selectedChoice = question.choices.find(
    (choice) => choice.id === selectedChoiceId,
  );

  if (!selectedChoice) {
    throw new Error("Invalid answer choice.");
  }

  const correctChoice = question.choices.find(
    (choice) => choice.gestureId === question.gestureId,
  );

  return {
    isCorrect: selectedChoice.gestureId === question.gestureId,
    correctChoiceId: correctChoice?.id ?? null,
  };
};

export const getAssessmentByCategory = async (
  categoryId: string,
  learnerId: string,
) => {
  const assessment =
    await prisma.assessment.findUnique({
      where: {
        categoryId,
      },

      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            learningAreaId: true,
            displayOrder: true,
          },
        },

        questions: {
          orderBy: {
            questionNumber: "asc",
          },

          include: {
            gesture: {
              select: {
                id: true,
                label: true,
                referenceImageUrl: true,
                referenceVideoUrl: true,
              },
            },

            choices: {
              orderBy: {
                displayOrder: "asc",
              },

              select: {
                id: true,
                choiceText: true,
                imageUrl: true,
                displayOrder: true,

                gesture: {
                  select: {
                    id: true,
                    label: true,
                    referenceImageUrl: true,
                    referenceVideoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!assessment) {
    throw new Error(
      "Assessment not found for this category.",
    );
  }

  if (assessment.status !== "PUBLISHED") {
    throw new Error(
      "This assessment is not available yet.",
    );
  }

  await assertLessonIsUnlocked(categoryId, learnerId);

  const previousAttempt =
    await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId: assessment.id,
        learnerId,
        completedAt: {
          not: null,
        },
      },

      orderBy: {
        completedAt: "desc",
      },
    });

  return {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    passingScore: assessment.passingScore,

    category: assessment.category,

    questions: assessment.questions.map(
      (question) => ({
        id: question.id,
        questionNumber:
          question.questionNumber,
        questionText:
          question.questionText,
        questionType:
          question.questionType,
        referenceMediaUrl:
          question.referenceMediaUrl,
        gesture: question.gesture,
        points: question.points,

        choices: question.choices.map(
          (choice) => ({
            id: choice.id,
            choiceText:
              choice.choiceText,
            imageUrl:
              choice.imageUrl,
            displayOrder:
              choice.displayOrder,

            gesture: choice.gesture,
          }),
        ),
      }),
    ),

    previousAttempt: previousAttempt
      ? {
          id: previousAttempt.id,
          score: previousAttempt.score,
          totalPoints:
            previousAttempt.totalPoints,
          completedAt:
            previousAttempt.completedAt,
        }
      : null,
  };
};

export const submitAssessment = async (
  categoryId: string,
  learnerId: string,
  answers: Array<{
    questionId: string;
    selectedChoiceId: string;
  }>,
) => {
  await assertLessonIsUnlocked(categoryId, learnerId);

  return prisma.$transaction(
    async (tx) => {
      const assessment =
        await tx.assessment.findUnique({
          where: {
            categoryId,
          },

          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                learningAreaId: true,
                displayOrder: true,
              },
            },

            questions: {
              include: {
                choices: true,
              },
            },
          },
        });

      if (!assessment) {
        throw new Error(
          "Assessment not found for this category.",
        );
      }

      if (assessment.status !== "PUBLISHED") {
        throw new Error(
          "This assessment is not available yet.",
        );
      }

      if (
        answers.length !==
        assessment.questions.length
      ) {
        throw new Error(
          "Please answer all questions before submitting.",
        );
      }

      const uniqueQuestionIds = new Set(
        answers.map((answer) => answer.questionId),
      );

      if (uniqueQuestionIds.size !== answers.length) {
        throw new Error(
          "Duplicate answers were submitted.",
        );
      }

      const questionMap = new Map(
        assessment.questions.map(
          (question) => [
            question.id,
            question,
          ],
        ),
      );

      let score = new Prisma.Decimal(0);
      let totalPoints =
        new Prisma.Decimal(0);

      const evaluatedAnswers =
        answers.map((answer) => {
          const question =
            questionMap.get(
              answer.questionId,
            );

          if (!question) {
            throw new Error(
              "Invalid assessment question.",
            );
          }

          const selectedChoice =
            question.choices.find(
              (choice) =>
                choice.id ===
                answer.selectedChoiceId,
            );

          if (!selectedChoice) {
            throw new Error(
              "Invalid answer choice.",
            );
          }

          const isCorrect =
            selectedChoice.gestureId ===
            question.gestureId;

          const pointsEarned = isCorrect
            ? new Prisma.Decimal(
                question.points,
              )
            : new Prisma.Decimal(0);

          totalPoints =
            totalPoints.add(
              question.points,
            );

          if (isCorrect) {
            score = score.add(
              question.points,
            );
          }

          return {
            questionId:
              question.id,
            selectedChoiceId:
              selectedChoice.id,
            isCorrect,
            pointsEarned,
          };
        });

      const percentage =
        totalPoints.gt(0)
          ? score
              .div(totalPoints)
              .mul(100)
          : new Prisma.Decimal(0);

      const passed =
        percentage.gte(
          assessment.passingScore,
        );

      const attempt =
        await tx.assessmentAttempt.create({
          data: {
            assessmentId:
              assessment.id,
            learnerId,
            score,
            totalPoints,
            completedAt:
              new Date(),

            answers: {
              create:
                evaluatedAnswers,
            },
          },

          include: {
            answers: {
              include: {
                question: {
                  include: {
                    gesture: true,
                  },
                },

                selectedChoice: {
                  include: {
                    gesture: true,
                  },
                },
              },
            },
          },
        });

      // ==========================================
      // PASS → COMPLETE CURRENT CATEGORY
      // ==========================================

      if (passed) {
        await tx.categoryProgress.upsert({
          where: {
            learnerId_categoryId: {
              learnerId,
              categoryId,
            },
          },

          update: {
            status: "COMPLETED",
            completedAt:
              new Date(),
          },

          create: {
            learnerId,
            categoryId,
            status: "COMPLETED",
            startedAt:
              new Date(),
            completedAt:
              new Date(),
          },
        });

        // ========================================
        // UNLOCK NEXT CATEGORY
        // ========================================

        const nextCategory =
          await tx.category.findFirst({
            where: {
              learningAreaId:
                assessment.category
                  .learningAreaId,

              isActive: true,

              displayOrder: {
                gt: assessment.category
                  .displayOrder,
              },
            },

            orderBy: {
              displayOrder: "asc",
            },
          });

        if (nextCategory) {
          await tx.categoryProgress.upsert({
            where: {
              learnerId_categoryId: {
                learnerId,
                categoryId:
                  nextCategory.id,
              },
            },

            update: {},

            create: {
              learnerId,
              categoryId:
                nextCategory.id,
              status: "NOT_STARTED",
            },
          });
        }
      }

      return {
        attemptId: attempt.id,

        score,

        totalPoints,

        percentage,

        passingScore:
          assessment.passingScore,

        passed,

        answers:
          attempt.answers.map(
            (answer) => ({
              questionId:
                answer.questionId,

              selectedChoiceId:
                answer.selectedChoiceId,

              isCorrect:
                answer.isCorrect,

              pointsEarned:
                answer.pointsEarned,
            }),
          ),
      };
    },
  );
};

export const getAssessmentsForLearner = async (
  learnerId: string,
) => {
  const [learningAreas, progressRecords, completedAttempts] =
    await Promise.all([
      prisma.learningArea.findMany({
        orderBy: {
          displayOrder: "asc",
        },
        include: {
          categories: {
            where: {
              isActive: true,
              assessment: {
                status: "PUBLISHED",
              },
            },
            orderBy: {
              displayOrder: "asc",
            },
            include: {
              assessment: {
                include: {
                  _count: {
                    select: {
                      questions: true,
                    },
                  },
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
          lessonCompletedAt: true,
        },
      }),

      prisma.assessmentAttempt.findMany({
        where: {
          learnerId,
          completedAt: {
            not: null,
          },
        },
        orderBy: {
          completedAt: "desc",
        },
        select: {
          assessmentId: true,
          score: true,
          totalPoints: true,
          completedAt: true,
          assessment: {
            select: {
              categoryId: true,
              passingScore: true,
            },
          },
        },
      }),
    ]);

  const progressByCategoryId = new Map(
    progressRecords.map((progress) => [
      progress.categoryId,
      progress,
    ]),
  );

  const attemptsByCategoryId = new Map<
    string,
    typeof completedAttempts
  >();

  for (const attempt of completedAttempts) {
    const categoryId = attempt.assessment.categoryId;
    const existing =
      attemptsByCategoryId.get(categoryId) ?? [];

    existing.push(attempt);
    attemptsByCategoryId.set(categoryId, existing);
  }

  return {
    learningAreas: learningAreas
      .map((area) => ({
        id: area.id,
        name: area.name,

        categories: area.categories
          .filter(
            (category) => category.assessment !== null,
          )
          .map((category) => {
            const assessment = category.assessment!;

            const progress = progressByCategoryId.get(
              category.id,
            );

            const isUnlocked =
              progress?.lessonCompletedAt != null ||
              progress?.status === "COMPLETED";

            const attempts =
              attemptsByCategoryId.get(category.id) ?? [];

            const attemptPassed = (
              attempt: (typeof attempts)[number],
            ) =>
              attempt.totalPoints.gt(0) &&
              attempt.score
                .div(attempt.totalPoints)
                .mul(100)
                .gte(attempt.assessment.passingScore);

            const latestAttempt = attempts[0] ?? null;

            const hasPassed = attempts.some(attemptPassed);

            const status: "locked" | "not-started" | "completed" =
              !isUnlocked
                ? "locked"
                : hasPassed
                  ? "completed"
                  : "not-started";

            return {
              categoryId: category.id,
              categoryName: category.name,
              assessmentId: assessment.id,
              title: assessment.title,
              description: assessment.description,
              totalQuestions: assessment._count.questions,
              isUnlocked,
              attemptCount: attempts.length,
              latestAttempt: latestAttempt
                ? {
                    score: latestAttempt.score,
                    totalPoints: latestAttempt.totalPoints,
                    percentage: latestAttempt.totalPoints.gt(0)
                      ? latestAttempt.score
                          .div(latestAttempt.totalPoints)
                          .mul(100)
                      : new Prisma.Decimal(0),
                    passed: attemptPassed(latestAttempt),
                    completedAt: latestAttempt.completedAt,
                  }
                : null,
              status,
            };
          }),
      }))
      .filter((area) => area.categories.length > 0),
  };
};
