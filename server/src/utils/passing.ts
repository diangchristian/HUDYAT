import type { Prisma } from "../generated/prisma/client.js";

/** A quiz attempt passes when its percentage reaches the quiz's passing score. */
export const quizAttemptPasses = (
  score: Prisma.Decimal,
  totalPoints: Prisma.Decimal,
  passingScore: Prisma.Decimal,
) => totalPoints.gt(0) && score.div(totalPoints).mul(100).gte(passingScore);

/** The Sign test passes when the learner signs 80% of the lesson's signs (rounded up). */
export const signTestPasses = (score: number, total: number) =>
  total > 0 && score >= Math.ceil(total * 0.8);
