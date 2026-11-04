import { prisma } from "../config/db.js";
import { recentActivity } from "./audit.service.js";

const RECENT_ACTIVITY_COUNT = 5;

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
