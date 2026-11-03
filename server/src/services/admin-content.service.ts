import { z } from "zod";

import { prisma } from "../config/db.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { recentActivity, recordAudit } from "./audit.service.js";

const RECENT_ACTIVITY_COUNT = 5;

/* ---------- Lessons ---------- */

// Only web or site-relative links, since these end up in the UI's href and src attributes.
const SAFE_MEDIA_URL = /^(https?:\/\/|\/(?!\/))/i;

const mediaUrl = z
  .string()
  .trim()
  .max(2048, "Media links must be 2048 characters or fewer.")
  .refine(
    (url) => url === "" || SAFE_MEDIA_URL.test(url),
    "Media links must start with https://, http:// or /.",
  )
  .transform((url) => url || null)
  .nullable();

const lessonInput = z.object({
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer.")
    .optional(),
  displayOrder: z
    .number("Order must be a whole number from 1.")
    .int("Order must be a whole number from 1.")
    .min(1, "Order must be a whole number from 1.")
    .optional(),
  isActive: z.boolean("Status must be true or false.").optional(),
  signs: z
    .array(
      z.object({
        id: z.string(),
        referenceImageUrl: mediaUrl,
        referenceVideoUrl: mediaUrl,
      }),
    )
    .optional(),
});

export const listLessons = async () => {
  const areas = await prisma.learningArea.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" },
        include: {
          gestures: {
            orderBy: { displayOrder: "asc" },
            include: { gesture: true },
          },
        },
      },
    },
  });

  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    lessons: area.categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      signs: category.gestures.map(({ gesture }) => ({
        id: gesture.id,
        label: gesture.label,
        referenceImageUrl: gesture.referenceImageUrl,
        referenceVideoUrl: gesture.referenceVideoUrl,
      })),
    })),
  }));
};

type SignMedia = {
  id: string;
  referenceImageUrl: string | null;
  referenceVideoUrl: string | null;
};

/*
 * Quiz screens get their media from the sign, so clearing it would break
 * them. Only a change is checked: media that was already missing shouldn't
 * block an unrelated edit.
 */
const assertMediaStillCoversQuizzes = async (
  sign: SignMedia,
  current: SignMedia,
) => {
  if (!sign.referenceVideoUrl && current.referenceVideoUrl) {
    const videoQuestions = await prisma.assessmentQuestion.count({
      where: { gestureId: sign.id, questionType: "VIDEO_GESTURE" },
    });
    if (videoQuestions > 0) {
      throw httpError(409, "A video quiz question uses this sign, so it needs a video.");
    }
  }

  if (!sign.referenceImageUrl && current.referenceImageUrl) {
    const imageChoices = await prisma.questionChoice.count({
      where: { gestureId: sign.id, question: { questionType: "IMAGE_GESTURE" } },
    });
    if (imageChoices > 0) {
      throw httpError(409, "An image quiz question uses this sign, so it needs an image.");
    }
  }
};

export const updateLesson = async (
  actorId: string,
  lessonId: string,
  input: unknown,
) => {
  const { signs = [], ...values } = parseInput(lessonInput, input);

  const lesson = await prisma.category.findUnique({
    where: { id: lessonId },
    include: { gestures: { include: { gesture: true } } },
  });
  if (!lesson) throw httpError(404, "Lesson not found.");

  for (const sign of signs) {
    const current = lesson.gestures.find(({ gestureId }) => gestureId === sign.id);
    if (!current) {
      throw httpError(404, "That sign isn't part of this lesson.");
    }
    await assertMediaStillCoversQuizzes(sign, current.gesture);
  }

  await prisma.$transaction(async (tx) => {
    const { displayOrder } = values;

    if (displayOrder !== undefined && displayOrder !== lesson.displayOrder) {
      const holder = await tx.category.findFirst({
        where: { learningAreaId: lesson.learningAreaId, displayOrder },
      });

      if (holder) {
        // The order is unique per area, so step aside before swapping.
        await tx.category.update({
          where: { id: lesson.id },
          data: { displayOrder: -lesson.displayOrder },
        });
        await tx.category.update({
          where: { id: holder.id },
          data: { displayOrder: lesson.displayOrder },
        });
      }
    }

    await tx.category.update({
      where: { id: lesson.id },
      data: {
        ...(values.description !== undefined && {
          description: values.description || null,
        }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(values.isActive !== undefined && { isActive: values.isActive }),
      },
    });

    for (const { id, referenceImageUrl, referenceVideoUrl } of signs) {
      await tx.fslGesture.update({
        where: { id },
        data: { referenceImageUrl, referenceVideoUrl },
      });
    }

    await recordAudit(tx, actorId, "LESSON_EDITED", "CATEGORY", lesson.id, lesson.name);
  });

  return { id: lesson.id };
};

/* ---------- Overview ---------- */

const quizPassRates = async () => {
  const assessments = await prisma.assessment.findMany({
    where: { category: { isActive: true } },
    orderBy: { category: { displayOrder: "asc" } },
    select: {
      passingScore: true,
      category: { select: { id: true, name: true } },
      assessmentAttempts: {
        where: { completedAt: { not: null }, totalPoints: { gt: 0 } },
        select: { score: true, totalPoints: true },
      },
    },
  });

  return assessments
    .filter(({ assessmentAttempts }) => assessmentAttempts.length > 0)
    .map(({ category, passingScore, assessmentAttempts }) => {
      const passed = assessmentAttempts.filter(
        ({ score, totalPoints }) =>
          Math.round((Number(score) / Number(totalPoints)) * 100) >=
          Number(passingScore),
      ).length;

      return {
        categoryId: category.id,
        lesson: category.name,
        attempts: assessmentAttempts.length,
        passRate: Math.round((passed / assessmentAttempts.length) * 100),
      };
    });
};

export const getOverview = async () => {
  const [
    teacherTotal,
    teacherActive,
    learnerTotal,
    learnerActive,
    lessonTotal,
    lessonActive,
    passRates,
    activity,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "TEACHER", isActive: true } }),
    prisma.user.count({ where: { role: "LEARNER" } }),
    prisma.user.count({ where: { role: "LEARNER", isActive: true } }),
    prisma.category.count(),
    prisma.category.count({ where: { isActive: true } }),
    quizPassRates(),
    recentActivity(RECENT_ACTIVITY_COUNT),
  ]);

  return {
    teachers: { total: teacherTotal, active: teacherActive },
    learners: { total: learnerTotal, active: learnerActive },
    deactivatedAccounts:
      teacherTotal - teacherActive + (learnerTotal - learnerActive),
    lessons: { total: lessonTotal, active: lessonActive },
    passRates,
    recentActivity: activity,
  };
};
