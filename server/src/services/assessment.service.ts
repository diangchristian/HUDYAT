import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/db.js";

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
