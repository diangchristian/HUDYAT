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
import { isDabestCategory, isShownSign } from "../../src/config/dabest.js";
import { assertDabestDatabase } from "./dabestGuard.js";

/*
 * DABEST: only the assessments of its four categories, and only questions
 * about the signs it shows (Colors: six of ten), numbered 1, 2, 3... again.
 * Keys are "<category>-<question_number in the data files>".
 */
const shownAssessments = assessments.filter((a) => isDabestCategory(a.category));
const shownQuestions = assessmentQuestions.filter(
  (q) => isDabestCategory(q.category) && isShownSign(q.category, q.gesture),
);
const questionNumber = new Map<string, number>();
for (const { category } of shownAssessments) {
  shownQuestions
    .filter((q) => q.category === category)
    .sort((a, b) => a.question_number - b.question_number)
    .forEach((q, index) => questionNumber.set(`${q.category}-${q.question_number}`, index + 1));
}
const shownChoices = questionChoices.filter((c) =>
  questionNumber.has(`${c.category}-${c.question_number}`),
);

const TEST_TEACHER_EMAIL = "testteacher@hudyat.local";


async function seedAssessments() {
  console.log("🌱 Seeding assessments...");

  try {
    await assertDabestDatabase(prisma);

    /*
     * ============================================================
     * 1. SEED ASSESSMENTS
     * ============================================================
     */

    // Seeded assessments are attributed to the test teacher
    // (run `npm run seed:test-teacher` first).
    const teacher = await prisma.teacherProfile.findUnique({
      where: { email: TEST_TEACHER_EMAIL },
    });

    if (!teacher) {
      throw new Error(
        `Teacher "${TEST_TEACHER_EMAIL}" was not found. Run \`npm run seed:test-teacher\` first.`
      );
    }

    const assessmentMap = new Map<string, string>();

    for (const assessmentData of shownAssessments) {
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
          createdBy: teacher.userId,
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

    for (const questionData of shownQuestions) {
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
            questionNumber: questionNumber.get(`${questionData.category}-${questionData.question_number}`)!,
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
          questionNumber: questionNumber.get(`${questionData.category}-${questionData.question_number}`)!,
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

    for (const questionData of shownChoices) {
      const questionKey =
        `${questionData.category}-${questionData.question_number}`;

      const questionId = questionMap.get(questionKey);

      if (!questionId) {
        throw new Error(
          `Question "${questionKey}" was not found.`
        );
      }

      try {
        await prisma.questionChoice.deleteMany({
          where: {
            questionId: questionId,
          },
        });
      } catch {
        /*
         * Some existing choices are protected by a RESTRICT foreign key
         * from AssessmentAnswer (a learner already answered using them).
         * Leave those rows in place — the upserts below still bring
         * matching choices up to date — instead of failing the whole run.
         */
        console.log(
          `  ⚠ Skipped clearing old choices for ${questionKey} (in use by existing attempts)`
        );
      }

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

        await prisma.questionChoice.upsert({
          where: {
            questionId_gestureId: {
              questionId: questionId,
              gestureId: gesture.id,
            },
          },
          update: {
            choiceText: choice.choice_text,
            displayOrder: choice.display_order,
          },
          create: {
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