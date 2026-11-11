/*
 * The Sign test: after passing a lesson's quiz, a learner signs every sign of the lesson in front of
 * the camera. Recognition runs in the browser, so the client reports which signs were missed (timed
 * out or skipped); the server checks they belong to the lesson and scores the go. It's optional
 * practice on top of the quiz: it never locks or unlocks lessons.
 */
import { z } from "zod";

import { prisma } from "../config/db.js";
import { hasCameraModel } from "../config/file-models.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { quizAttemptPasses, signTestPasses } from "../utils/passing.js";

const signTestInput = z.object({
  missedGestureIds: z.array(z.string(), "Send the missed signs as a list.").max(200, "That's too many signs."),
});

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
  const { assessment } = lesson;
  // Like the quiz list: an unpublished quiz (and its Sign test) is hidden from learners.
  const quizPassed = assessment?.status === "PUBLISHED" && assessment.assessmentAttempts.some((attempt) =>
    quizAttemptPasses(attempt.score, attempt.totalPoints, assessment.passingScore),
  );
  if (!quizPassed) throw httpError(409, "Pass this lesson's quiz first.");

  const lessonSigns = new Set(lesson.gestures.map(({ gestureId }) => gestureId));
  const missed = [...new Set(missedGestureIds)];
  if (missed.some((id) => !lessonSigns.has(id))) {
    throw httpError(400, "That sign isn't part of this lesson.");
  }

  const total = lessonSigns.size;
  const score = total - missed.length;
  await prisma.signTestAttempt.create({
    data: { learnerId, categoryId, score, total, missedGestureIds: missed },
  });

  return { score, total, passed: signTestPasses(score, total) };
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
