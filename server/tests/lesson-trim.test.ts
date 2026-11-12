import assert from "node:assert/strict";
import { test } from "node:test";

import { planQuizCleanup, planSignRemoval } from "../prisma/scripts/lessonTrim.ts";

const links = ["Circle", "Square", "Pentagon", "Hexagon", "Oval"].map((label) => ({
  id: `link-${label}`,
  gestureId: `sign-${label}`,
  label,
}));

test("removing signs keeps the rest in order and moves checkpoints to the next kept sign", () => {
  const plan = planSignRemoval(links, ["Pentagon", "Hexagon"]);

  assert.deepEqual(plan.kept.map((link) => link.label), ["Circle", "Square", "Oval"]);
  assert.deepEqual(plan.removed.map((link) => link.label), ["Pentagon", "Hexagon"]);
  // A kept sign keeps its place in the lesson (and the learner's step).
  assert.deepEqual(plan.remapCheckpoint(1), { index: 1, resetStep: false });
  assert.deepEqual(plan.remapCheckpoint(4), { index: 2, resetStep: false });
  // A removed sign moves the learner to the next kept sign, starting it over.
  assert.deepEqual(plan.remapCheckpoint(2), { index: 2, resetStep: true });
  assert.deepEqual(plan.remapCheckpoint(3), { index: 2, resetStep: true });
});

test("a removed last sign sends the learner to the last kept sign; a rerun changes nothing", () => {
  const plan = planSignRemoval(links, ["Oval"]);
  assert.deepEqual(plan.remapCheckpoint(4), { index: 3, resetStep: true });

  const rerun = planSignRemoval(plan.kept, ["Oval"]);
  assert.deepEqual(rerun.removed, []);
  assert.deepEqual(rerun.remapCheckpoint(3), { index: 3, resetStep: false });
});

const question = (id: string, questionNumber: number, target: string, choices: string[]) => ({
  id,
  questionNumber,
  gestureId: `sign-${target}`,
  choices: choices.map((label, i) => ({ id: `${id}-${label}`, gestureId: `sign-${label}`, displayOrder: i + 1 })),
});

test("quiz cleanup drops questions about removed signs, swaps removed wrong answers and renumbers", () => {
  const kept = ["Circle", "Square", "Oval"].map((label) => ({ gestureId: `sign-${label}`, label }));
  const plan = planQuizCleanup(
    [
      question("q1", 1, "Circle", ["Circle", "Square", "Oval"]),
      question("q2", 2, "Pentagon", ["Circle", "Pentagon", "Hexagon"]),
      question("q3", 3, "Oval", ["Pentagon", "Hexagon", "Oval"]),
    ],
    kept,
  );

  assert.deepEqual(plan.deleteQuestionIds, ["q2"]);
  // Replacements are kept signs not already in the question, in lesson order.
  assert.deepEqual(plan.choiceSwaps, [
    { choiceId: "q3-Pentagon", gestureId: "sign-Circle", choiceText: "Circle" },
    { choiceId: "q3-Hexagon", gestureId: "sign-Square", choiceText: "Square" },
  ]);
  assert.deepEqual(plan.renumber, [
    { id: "q1", questionNumber: 1 },
    { id: "q3", questionNumber: 2 },
  ]);
});

test("a clean quiz needs no changes", () => {
  const kept = ["Circle", "Square", "Oval"].map((label) => ({ gestureId: `sign-${label}`, label }));
  const plan = planQuizCleanup([question("q1", 1, "Circle", ["Circle", "Square", "Oval"])], kept);
  assert.deepEqual(plan, { deleteQuestionIds: [], choiceSwaps: [], renumber: [{ id: "q1", questionNumber: 1 }] });
});
