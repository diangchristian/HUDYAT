import { z } from "zod";

import { prisma } from "../config/db.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { recentActivity, recordAudit } from "./audit.service.js";

const RECENT_ACTIVITY_COUNT = 5;

/* ---------- Lessons ---------- */

// Strict: lesson content belongs to teachers (see teacher-lesson.service).
const lessonInput = z.strictObject({
  displayOrder: z
    .number("Order must be a whole number from 1.")
    .int("Order must be a whole number from 1.")
    .min(1, "Order must be a whole number from 1.")
    .optional(),
  isActive: z.boolean("Status must be true or false.").optional(),
});

export const listLessons = async () => {
  const areas = await prisma.learningArea.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" },
        include: { _count: { select: { gestures: true } } },
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
      signCount: category._count.gestures,
    })),
  }));
};

export const updateLesson = async (
  actorId: string,
  lessonId: string,
  input: unknown,
) => {
  const values = parseInput(lessonInput, input);

  const lesson = await prisma.category.findUnique({ where: { id: lessonId } });
  if (!lesson) throw httpError(404, "Lesson not found.");

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
        await recordAudit(tx, actorId, "LESSON_EDITED", "CATEGORY", holder.id, holder.name);
      }
    }

    await tx.category.update({
      where: { id: lesson.id },
      data: {
        ...(displayOrder !== undefined && { displayOrder }),
        ...(values.isActive !== undefined && { isActive: values.isActive }),
      },
    });

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
      // Same comparison as grading in assessment.service, so the rate matches what learners saw.
      const passed = assessmentAttempts.filter(({ score, totalPoints }) =>
        score.div(totalPoints).mul(100).gte(passingScore),
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
