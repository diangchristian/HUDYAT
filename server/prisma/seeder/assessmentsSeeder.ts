import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({adapter});



import assessments from "../data/assessment/assessment.json";
import assessmentQuestions from "../data/assessment/assessmentQuestions.json";
import questionChoices from "../data/assessment/questionChoices.json";


async function seedAssessments() {
  console.log("🌱 Seeding assessments...");

  try {
    /*
     * ============================================================
     * 1. SEED ASSESSMENTS
     * ============================================================
     */

    const assessmentMap = new Map<string, string>();

    for (const assessmentData of assessments) {
      // Find the existing category
      const category = await prisma.category.findFirst({
        where: {
            name: assessmentData.category
        }
        });

      if (!category) {
        throw new Error(
          `Category "${assessmentData.category}" was not found.`
        );
      }

      // Find existing assessment for this category
      // This prevents duplicate assessments when running the seeder again.
      const assessment = await prisma.assessment.upsert({
        where: {
          categoryId: category.id,
        },
        update: {
          title: assessmentData.title,
          description: assessmentData.description,
          passingScore: assessmentData.passing_score,
          status: "PUBLISHED",
        },
        create: {
          categoryId: category.id,
          // Change this depending on how created_by is handled
          createdBy: "9c92c146-7445-4512-a479-0309b58e350c",
          title: assessmentData.title,
          description: assessmentData.description,
          passingScore: assessmentData.passing_score,
          status: "PUBLISHED",
        },
      });

      assessmentMap.set(assessmentData.category, assessment.id);

      console.log(`✓ Assessment: ${assessmentData.title}`);
    }

    /*
     * ============================================================
     * 2. SEED ASSESSMENT QUESTIONS
     * ============================================================
     */

    const questionMap = new Map<string, string>();

    for (const questionData of assessmentQuestions) {
      // Get assessment ID using category name
      const assessmentId = assessmentMap.get(questionData.category);

      if (!assessmentId) {
        throw new Error(
          `Assessment for category "${questionData.category}" was not found.`
        );
      }

      // Find the existing gesture using its label
      const gesture = await prisma.fslGesture.findUnique({
        where: {
          label: questionData.gesture,
        },
      });

      if (!gesture) {
        throw new Error(
          `Gesture "${questionData.gesture}" was not found.`
        );
      }

      /*
       * Create/update the question.
       *
       * Using assessmentId + questionNumber as the lookup allows
       * the seeder to be safely run again.
       */
      const question = await prisma.assessmentQuestion.upsert({
        where: {
          assessmentId_questionNumber: {
            assessmentId: assessmentId,
            questionNumber: questionData.question_number,
          },
        },
        update: {
          gestureId: gesture.id,
          questionText: questionData.question_text,
            questionType: questionData.question_type === "IMAGE_GESTURE" ? "IMAGE_GESTURE" : "VIDEO_GESTURE",
          referenceMediaUrl: questionData.reference_media_url,
          points: questionData.points,
        },
        create: {
          assessmentId: assessmentId,
          gestureId: gesture.id,
          questionNumber: questionData.question_number,
          questionText: questionData.question_text,
          questionType: questionData.question_type === "IMAGE_GESTURE" ? "IMAGE_GESTURE" : "VIDEO_GESTURE",
          referenceMediaUrl: questionData.reference_media_url,
          points: questionData.points,
        },
      });

      /*
       * Store the generated question ID.
       *
       * Example:
       * "Alphabet-1" -> "actual-question-uuid"
       */
      const questionKey =
        `${questionData.category}-${questionData.question_number}`;

      questionMap.set(questionKey, question.id);

      console.log(
        `  ✓ Question ${questionData.question_number}: ${questionData.category}`
      );
    }

    /*
     * ============================================================
     * 3. SEED QUESTION CHOICES
     * ============================================================
     */

    for (const questionData of questionChoices) {
      const questionKey =
        `${questionData.category}-${questionData.question_number}`;

      const questionId = questionMap.get(questionKey);

      if (!questionId) {
        throw new Error(
          `Question "${questionKey}" was not found.`
        );
      }

      await prisma.questionChoice.deleteMany({
        where: {
          questionId: questionId,
        },
      });

      for (const choice of questionData.choices) {
        // Find the existing gesture
        const gesture = await prisma.fslGesture.findFirst({
          where: {
            label: {
              equals: choice.gesture,
              mode: "insensitive",
            },
          },
        });

        if (!gesture) {
          throw new Error(
            `Gesture "${choice.gesture}" was not found.`
          );
        }

        await prisma.questionChoice.create({
          data: {
            questionId: questionId,
            gestureId: gesture.id,
            choiceText: choice.choice_text,
            displayOrder: choice.display_order,
            // isCorrect no longer exists on QuestionChoice —
            // correctness is derived at submit time by comparing
            // choice.gestureId to the question's target gestureId.
          },
        });
      }

      console.log(
        `  ✓ Choices: ${questionData.category} #${questionData.question_number}`
      );
    }

    console.log("✅ Assessment seeding completed!");
  } catch (error) {
    console.error("❌ Assessment seeding failed:");
    console.error(error);

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAssessments();