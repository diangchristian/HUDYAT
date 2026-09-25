import { prisma } from "../config/db.js";
import { httpError } from "../utils/httpError.js";
import { getMyProgress } from "./progress.service.js";

const toPercentage = (score: number, totalPoints: number) =>
  totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

const attemptSelect = {
  id: true,
  score: true,
  totalPoints: true,
  completedAt: true,
  learner: { select: { userId: true, fullName: true } },
  assessment: {
    select: {
      title: true,
      passingScore: true,
      category: { select: { id: true, name: true } },
    },
  },
} as const;

type AttemptRow = {
  id: string;
  score: { toString(): string };
  totalPoints: { toString(): string };
  completedAt: Date | null;
  learner: { userId: string; fullName: string };
  assessment: {
    title: string;
    passingScore: { toString(): string };
    category: { id: string; name: string };
  };
};

const toAttemptSummary = (attempt: AttemptRow) => {
  const score = Number(attempt.score);
  const totalPoints = Number(attempt.totalPoints);
  const percentage = toPercentage(score, totalPoints);

  return {
    id: attempt.id,
    learnerId: attempt.learner.userId,
    learnerName: attempt.learner.fullName,
    categoryId: attempt.assessment.category.id,
    categoryName: attempt.assessment.category.name,
    assessmentTitle: attempt.assessment.title,
    score,
    totalPoints,
    percentage,
    passed: totalPoints > 0 && percentage >= Number(attempt.assessment.passingScore),
    completedAt: attempt.completedAt,
  };
};

export const getDashboard = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    learnerCount,
    assessmentsByStatus,
    categoryCount,
    recentAttempts,
    completedAttempts,
    practicedToday,
  ] = await Promise.all([
    prisma.learnerProfile.count(),
    prisma.assessment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.assessmentAttempt.findMany({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 8,
      select: attemptSelect,
    }),
    prisma.assessmentAttempt.findMany({
      where: { completedAt: { not: null }, totalPoints: { gt: 0 } },
      select: { score: true, totalPoints: true },
    }),
    // Distinct learners with at least one practice attempt today
    // (server-local midnight).
    prisma.practiceSession.groupBy({
      by: ["learnerId"],
      where: { attemptedAt: { gte: startOfToday } },
    }),
  ]);

  const averageQuizScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce(
            (total, attempt) =>
              total + Number(attempt.score) / Number(attempt.totalPoints),
            0,
          ) /
            completedAttempts.length *
            100,
        )
      : null;

  const countFor = (status: string) =>
    assessmentsByStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    learnerCount,
    categoryCount,
    averageQuizScore,
    practicedTodayCount: practicedToday.length,
    assessments: {
      published: countFor("PUBLISHED"),
      draft: countFor("DRAFT"),
      archived: countFor("ARCHIVED"),
    },
    recentAttempts: recentAttempts.map(toAttemptSummary),
  };
};

/*
 * There's no class/section relation between teachers and learners
 * yet, so every teacher sees every learner.
 */
export const listLearners = async () => {
  const [learners, totalCategories] = await Promise.all([
    prisma.learnerProfile.findMany({
      orderBy: { fullName: "asc" },
      select: {
        userId: true,
        fullName: true,
        avatarKey: true,
        dateJoined: true,
        user: { select: { username: true, email: true, isActive: true } },
        // Match `totalCategories`, which only counts active lessons.
        categoryProgress: {
          where: { category: { isActive: true } },
          select: { status: true },
        },
        assessmentAttempts: {
          where: { completedAt: { not: null } },
          orderBy: { completedAt: "desc" },
          select: { completedAt: true },
        },
      },
    }),
    prisma.category.count({ where: { isActive: true } }),
  ]);

  return learners.map((learner) => ({
    id: learner.userId,
    fullName: learner.fullName,
    username: learner.user.username,
    email: learner.user.email,
    avatarKey: learner.avatarKey,
    isActive: learner.user.isActive,
    dateJoined: learner.dateJoined,
    totalCategories,
    completedCategories: learner.categoryProgress.filter(
      (progress) => progress.status === "COMPLETED",
    ).length,
    inProgressCategories: learner.categoryProgress.filter(
      (progress) => progress.status === "IN_PROGRESS",
    ).length,
    assessmentAttempts: learner.assessmentAttempts.length,
    lastActivityAt: learner.assessmentAttempts[0]?.completedAt ?? null,
  }));
};

export const getLearnerDetail = async (learnerId: string) => {
  const learner = await prisma.learnerProfile.findUnique({
    where: { userId: learnerId },
    select: {
      userId: true,
      fullName: true,
      avatarKey: true,
      dateJoined: true,
      user: { select: { username: true, email: true, isActive: true } },
    },
  });

  if (!learner) {
    throw httpError(404, "Learner not found.");
  }

  const [progress, attempts, practiceTotals] = await Promise.all([
    getMyProgress(learnerId),
    prisma.assessmentAttempt.findMany({
      where: { learnerId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: attemptSelect,
    }),
    prisma.practiceSession.groupBy({
      by: ["isCorrect"],
      where: { learnerId },
      _count: { _all: true },
    }),
  ]);

  const correctPractice =
    practiceTotals.find((row) => row.isCorrect)?._count._all ?? 0;
  const totalPractice = practiceTotals.reduce(
    (total, row) => total + row._count._all,
    0,
  );

  return {
    learner: {
      id: learner.userId,
      fullName: learner.fullName,
      username: learner.user.username,
      email: learner.user.email,
      avatarKey: learner.avatarKey,
      isActive: learner.user.isActive,
      dateJoined: learner.dateJoined,
    },
    progress,
    attempts: attempts.map(toAttemptSummary),
    practice: {
      totalAttempts: totalPractice,
      correctAttempts: correctPractice,
      accuracy: toPercentage(correctPractice, totalPractice),
    },
  };
};
