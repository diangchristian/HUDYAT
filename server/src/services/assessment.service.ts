import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/db.js";

import { assessmentAccess } from './assessment-access.js';

const assertAssessmentIsUnlocked=async(categoryId:string,learnerId:string)=>{
 const list=await getAssessmentsForLearner(learnerId);
 const category=list.learningAreas.flatMap(area=>area.categories).find(category=>category.categoryId===categoryId);
 if(!category?.isUnlocked){
  const error=new Error(category?.lockedReason??'Assessment category not found.') as Error & {statusCode:number};
  error.statusCode=category?403:404;throw error;
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

  await assertAssessmentIsUnlocked(categoryId, learnerId);

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

  await assertAssessmentIsUnlocked(categoryId, learnerId);

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
  await assertAssessmentIsUnlocked(categoryId, learnerId);

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

export const getAssessmentsForLearner = async (learnerId:string) => {
 const [learningAreas,attempts]=await Promise.all([
  prisma.learningArea.findMany({
   where:{isActive:true},orderBy:[{displayOrder:'asc'},{id:'asc'}],
   include:{categories:{
    where:{isActive:true},orderBy:[{displayOrder:'asc'},{id:'asc'}],
    include:{assessment:{include:{_count:{select:{questions:true}}}}}
   }}
  }),
  prisma.assessmentAttempt.findMany({where:{learnerId,completedAt:{not:null}},orderBy:[{completedAt:'desc'},{id:'asc'}],select:{assessmentId:true,score:true,totalPoints:true,completedAt:true,assessment:{select:{categoryId:true,passingScore:true}}}})
 ]);
 const passed=(attempt:typeof attempts[number])=>attempt.totalPoints.gt(0)&&attempt.score.div(attempt.totalPoints).mul(100).gte(attempt.assessment.passingScore);
 const categories=learningAreas.flatMap(area=>area.categories);
 const byCategory=new Map(categories.map(category=>[category.id,attempts.filter(attempt=>attempt.assessment.categoryId===category.id)]));
 const access=assessmentAccess(categories.map(category=>({passed:byCategory.get(category.id)!.some(passed),published:category.assessment?.status==='PUBLISHED',questionCount:category.assessment?._count.questions??0})));
 const accessById=new Map(categories.map((category,index)=>[category.id,access[index]]));
 return {learningAreas:learningAreas.map(area=>({id:area.id,name:area.name,categories:area.categories.map(category=>{
  const assessment=category.assessment,history=byCategory.get(category.id)!,latest=history[0];
  return {categoryId:category.id,categoryName:category.name,assessmentId:assessment?.id??null,title:assessment?.title??category.name,
   description:assessment?.description??category.description,totalQuestions:assessment?._count.questions??0,
   ...accessById.get(category.id)!,attemptCount:history.length,latestAttempt:latest?{
    score:latest.score,totalPoints:latest.totalPoints,percentage:latest.totalPoints.gt(0)?latest.score.div(latest.totalPoints).mul(100):new Prisma.Decimal(0),passed:passed(latest),completedAt:latest.completedAt
   }:null};
 })})).filter(area=>area.categories.length>0)};
};
