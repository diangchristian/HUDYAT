/*
 * Takes signs the camera models can't check out of their lessons, and out of those lessons'
 * quizzes (Colors' signs were unlinked by trimColors.ts; its quiz is cleaned here).
 * Preview by default; add --apply to write. Run from server: npx tsx prisma/scripts/trimLessonSigns.ts
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";

import { prisma } from "../../src/config/db.js";
import { planQuizCleanup, planSignRemoval } from "./lessonTrim.js";

const REMOVED: Record<string, string[]> = {
  Shapes: ["Pentagon", "Hexagon"],
  "WH Questions": ["Which", "How Many", "How Much", "Whose"],
  Colors: [],
};
const apply = process.argv.includes("--apply");

try {
  const result = await prisma.$transaction(
    async (tx) => {
      const report = [];
      for (const [name, removedLabels] of Object.entries(REMOVED)) {
        const categories = await tx.category.findMany({ where: { name } });
        if (categories.length !== 1) throw Error(`Expected one ${name} category`);
        const categoryId = categories[0]!.id;

        const links = await tx.categoryGesture.findMany({
          where: { categoryId },
          include: { gesture: true },
          orderBy: { displayOrder: "asc" },
        });
        const signs = planSignRemoval(
          links.map((link) => ({ ...link, label: link.gesture.label })),
          removedLabels,
        );
        const progress = await tx.categoryProgress.findMany({
          where: { categoryId },
          select: { id: true, lastGestureIndex: true, lastLessonStep: true },
        });
        if (progress.some((p) => p.lastGestureIndex < 0 || p.lastGestureIndex >= links.length)) {
          throw Error(`Unexpected learner checkpoint in ${name}`);
        }

        const assessment = await tx.assessment.findUnique({
          where: { categoryId },
          include: {
            questions: { include: { choices: true } },
            _count: { select: { assessmentAttempts: true } },
          },
        });
        const quiz = assessment
          ? planQuizCleanup(
              assessment.questions,
              signs.kept.map((link) => ({ gestureId: link.gestureId, label: link.gesture.label })),
            )
          : null;
        const quizChanged =
          !!quiz &&
          (quiz.deleteQuestionIds.length > 0 ||
            quiz.choiceSwaps.length > 0 ||
            quiz.renumber.some(
              (row) => assessment!.questions.find((q) => q.id === row.id)!.questionNumber !== row.questionNumber,
            ));
        // Answers block deleting their questions, and changing a taken quiz would rewrite its history.
        if (quizChanged && assessment!._count.assessmentAttempts > 0) {
          throw Error(`${name}'s quiz has attempts; change it by hand instead.`);
        }
        const signsChanged = signs.removed.length > 0 || signs.kept.some((link, i) => link.displayOrder !== i + 1);

        if (apply && (signsChanged || quizChanged)) {
          await mkdir("backups", { recursive: true });
          await writeFile(
            `backups/lesson-trim-${name.replace(/\s+/g, "-")}-${Date.now()}.json`,
            JSON.stringify({ categoryId, links, progress, assessment }, null, 2),
            { flag: "wx" },
          );

          if (signsChanged) {
            await tx.categoryGesture.deleteMany({ where: { id: { in: signs.removed.map((link) => link.id) } } });
            // Renumber through a gap: displayOrder is unique per lesson.
            const offset = Math.max(...links.map((link) => link.displayOrder)) + 100;
            for (const [i, link] of signs.kept.entries()) {
              await tx.categoryGesture.update({ where: { id: link.id }, data: { displayOrder: offset + i } });
            }
            for (const [i, link] of signs.kept.entries()) {
              await tx.categoryGesture.update({ where: { id: link.id }, data: { displayOrder: i + 1 } });
            }
            for (const p of progress) {
              const { index, resetStep } = signs.remapCheckpoint(p.lastGestureIndex);
              await tx.categoryProgress.update({
                where: { id: p.id },
                data: { lastGestureIndex: index, ...(resetStep ? { lastLessonStep: "meaning" } : {}) },
              });
            }
          }

          if (quizChanged) {
            await tx.assessmentQuestion.deleteMany({ where: { id: { in: quiz!.deleteQuestionIds } } });
            for (const swap of quiz!.choiceSwaps) {
              await tx.questionChoice.update({
                where: { id: swap.choiceId },
                data: { gestureId: swap.gestureId, choiceText: swap.choiceText },
              });
            }
            // questionNumber is unique per quiz, so renumber through a gap too.
            for (const [i, row] of quiz!.renumber.entries()) {
              await tx.assessmentQuestion.update({ where: { id: row.id }, data: { questionNumber: 1000 + i } });
            }
            for (const row of quiz!.renumber) {
              await tx.assessmentQuestion.update({ where: { id: row.id }, data: { questionNumber: row.questionNumber } });
            }
          }
        }

        report.push({
          lesson: name,
          signsChanged,
          removedSigns: signs.removed.map((link) => link.gesture.label),
          remainingSigns: signs.kept.map((link) => link.gesture.label),
          checkpoints: progress.length,
          quizChanged,
          deletedQuestions: quiz?.deleteQuestionIds.length ?? 0,
          swappedChoices: quiz?.choiceSwaps.length ?? 0,
          questionsLeft: quiz?.renumber.length ?? 0,
        });
      }
      return { mode: apply ? "applied" : "preview", report };
    },
    { isolationLevel: "Serializable", timeout: 60000 },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await prisma.$disconnect();
}
