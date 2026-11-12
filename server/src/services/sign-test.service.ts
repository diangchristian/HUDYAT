/*
 * The Sign test: after passing a lesson's quiz, a learner signs every sign of the lesson in front of
 * the camera. Recognition runs in the browser, so the client reports which signs were missed (timed
 * out or skipped); the server checks they belong to the lesson and scores the go. Where the camera
 * can check the lesson, passing it (after the quiz) is what completes the lesson and unlocks the next.
 */
import { z } from "zod";

import { prisma } from "../config/db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { hasCameraModel } from "../config/file-models.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { quizAttemptPasses, signTestPasses } from "../utils/passing.js";

const signTestInput = z.object({
  missedGestureIds: z.array(z.string(), "Send the missed signs as a list.").max(200, "That's too many signs."),
});

type QuizForPassing = {
  status: string;
  passingScore: Prisma.Decimal;
  assessmentAttempts: { score: Prisma.Decimal; totalPoints: Prisma.Decimal }[];
} | null | undefined;

/** Like the quiz list: an unpublished quiz (and its Sign test) is hidden from learners, so it can't count. */
const quizPassed = (quiz: QuizForPassing) =>
  quiz?.status === "PUBLISHED" &&
  quiz.assessmentAttempts.some((attempt) => quizAttemptPasses(attempt.score, attempt.totalPoints, quiz.passingScore));

export const submitSignTest = async (learnerId: string, categoryId: string, input: unknown) => {
  const { missedGestureIds } = parseInput(signTestInput, input);

  const lesson = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      name: true,
      isActive: true,
      gestures: { select: { gestureId: true } },
      assessment: {
        select: {
          status: true,
          passingScore: true,
          assessmentAttempts: {
            where: { learnerId, completedAt: { not: null } },
            select: { score: true, totalPoints: true },
          },
        },
      },
    },
  });
  // Hidden lessons stay hidden from learners, even by direct link.
  if (!lesson || !lesson.isActive) throw httpError(404, "Lesson not found.");
  if (!hasCameraModel(lesson.name)) {
    throw httpError(409, "This lesson can't check signs with the camera yet.");
  }
  if (!quizPassed(lesson.assessment)) throw httpError(409, "Pass this lesson's quiz first.");

  const lessonSigns = new Set(lesson.gestures.map(({ gestureId }) => gestureId));
  const missed = [...new Set(missedGestureIds)];
  if (missed.some((id) => !lessonSigns.has(id))) {
    throw httpError(400, "That sign isn't part of this lesson.");
  }

  const total = lessonSigns.size;
  const score = total - missed.length;
  // Saved together, so a failure never leaves a saved go the learner is told wasn't saved.
  const lessonCompleted = await prisma.$transaction(async (tx) => {
    await tx.signTestAttempt.create({
      data: { learnerId, categoryId, score, total, missedGestureIds: missed },
    });
    return completeLessonIfPassed(tx, learnerId, categoryId);
  });

  return { score, total, passed: signTestPasses(score, total), lessonCompleted };
};

/*
 * A lesson is complete (and the next one unlocked) once its published quiz is passed and, where the
 * camera can check it, its Sign test too. Lessons completed before the Sign test counted stay complete.
 * Returns whether the lesson is complete.
 */
export const completeLessonIfPassed = async (
  db: Prisma.TransactionClient,
  learnerId: string,
  categoryId: string,
) => {
  const key = { learnerId_categoryId: { learnerId, categoryId } };
  const progress = await db.categoryProgress.findUnique({ where: key, select: { status: true } });
  if (progress?.status === "COMPLETED") return true;

  const lesson = await db.category.findUnique({
    where: { id: categoryId },
    select: {
      name: true,
      assessment: {
        select: {
          status: true,
          passingScore: true,
          assessmentAttempts: {
            where: { learnerId, completedAt: { not: null } },
            select: { score: true, totalPoints: true },
          },
        },
      },
      signTestAttempts: { where: { learnerId }, select: { score: true, total: true } },
    },
  });
  if (!lesson || !quizPassed(lesson.assessment)) return false;
  if (hasCameraModel(lesson.name) && !lesson.signTestAttempts.some((go) => signTestPasses(go.score, go.total))) {
    return false;
  }

  const now = new Date();
  await db.categoryProgress.upsert({
    where: key,
    update: { status: "COMPLETED", completedAt: now },
    create: { learnerId, categoryId, status: "COMPLETED", startedAt: now, completedAt: now },
  });
  return true;
};

/** Each lesson's best go (highest score, then latest), with how many goes the learner has had. */
export const bestSignTests = async (learnerId: string) => {
  const attempts = await prisma.signTestAttempt.findMany({
    where: { learnerId },
    orderBy: [{ score: "desc" }, { completedAt: "desc" }],
    select: { categoryId: true, score: true, total: true, missedGestureIds: true, completedAt: true },
  });

  const best = new Map<string, (typeof attempts)[number] & { attempts: number }>();
  for (const attempt of attempts) {
    const seen = best.get(attempt.categoryId);
    if (seen) seen.attempts += 1;
    else best.set(attempt.categoryId, { ...attempt, attempts: 1 });
  }
  return best;
};
