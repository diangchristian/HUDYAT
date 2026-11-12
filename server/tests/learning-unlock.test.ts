import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { prisma } from "../src/config/db.js";
import { learningStatuses } from "../src/services/learning.service.js";
import { LOGIN_PATH, PASSWORD, testContext } from "./helpers.js";

const ctx = testContext("unlock");

let learnerToken: string;
let teacherId: string;

before(async () => {
  await ctx.start();
  const learner = await ctx.createUser("LEARNER");
  const { data } = await ctx.request("POST", LOGIN_PATH.LEARNER, {
    body: { identifier: learner.username, password: PASSWORD },
  });
  learnerToken = data.token;
  teacherId = (await ctx.createUser("TEACHER")).id;
});
after(ctx.stop);

test("lessons unlock one at a time: the first unfinished one is current, the rest locked", () => {
  assert.deepEqual(learningStatuses([true, true, false, false]), ["completed", "completed", "current", "locked"]);
  // A lesson finished out of order (e.g. a lesson moved earlier) stays completed; still only one is current.
  assert.deepEqual(learningStatuses([false, true, false]), ["current", "completed", "locked"]);
  assert.deepEqual(learningStatuses([true, true]), ["completed", "completed"]);
});

/*
 * An area ahead of every real one (and of earlier tests' areas), so its lessons start
 * the learner's chain. One sign per lesson.
 */
let areaOrder = -1000;
const createLessons = async (quizStatuses: Array<"PUBLISHED" | "DRAFT" | null>) => {
  const area = await prisma.learningArea.create({
    data: { name: ctx.unique("area"), displayOrder: areaOrder-- },
  });
  const lessons = [];
  for (const [i, quizStatus] of quizStatuses.entries()) {
    const label = ctx.unique("sign");
    const sign = await prisma.fslGesture.create({ data: { label, modelClass: label } });
    lessons.push(
      await prisma.category.create({
        data: {
          learningAreaId: area.id,
          name: ctx.unique("lesson"),
          displayOrder: i + 1,
          gestures: { create: { gestureId: sign.id, displayOrder: 1 } },
          ...(quizStatus && {
            assessment: { create: { title: "Quiz", passingScore: 70, status: quizStatus, createdBy: teacherId } },
          }),
        },
      }),
    );
  }
  return lessons;
};

const finishLesson = (categoryId: string) =>
  ctx.request("PATCH", `/api/learning/categories/${categoryId}/checkpoint`, {
    token: learnerToken,
    body: { gestureIndex: 0, lessonStep: "try" },
  });

const statusOf = async (categoryId: string) => {
  const { data } = await ctx.request("GET", "/api/learning/areas", { token: learnerToken });
  return data
    .flatMap((area: { categories: Array<{ id: string; learningStatus: string }> }) => area.categories)
    .find((category: { id: string }) => category.id === categoryId).learningStatus;
};

test("a locked lesson can't be saved or finished, even by direct link", async () => {
  const [first, second] = await createLessons(["PUBLISHED", "PUBLISHED"]);

  assert.equal(await statusOf(second!.id), "locked");
  const { status } = await finishLesson(second!.id);
  assert.equal(status, 403);
  assert.equal(await prisma.categoryProgress.count({ where: { categoryId: second!.id } }), 0);

  const lesson = await ctx.request("GET", `/api/learning/categories/${second!.id}`, { token: learnerToken });
  assert.equal(lesson.data.learningStatus, "locked");

  // Finishing a lesson with a published quiz isn't enough: the quiz still has to be passed.
  assert.equal((await finishLesson(first!.id)).status, 200);
  assert.equal(await statusOf(first!.id), "current");
  assert.equal(await statusOf(second!.id), "locked");
});

test("a lesson with no published quiz unlocks the next one once it's finished", async () => {
  const [draft, none, next] = await createLessons(["DRAFT", null, "PUBLISHED"]);

  assert.equal((await finishLesson(draft!.id)).status, 200);
  assert.equal(await statusOf(draft!.id), "completed");
  assert.equal(await statusOf(none!.id), "current");

  assert.equal((await finishLesson(none!.id)).status, 200);
  assert.equal(await statusOf(next!.id), "current");
});

test("a finished lesson without a quiz stays complete when its quiz is published later", async () => {
  const [lesson, next] = await createLessons(["DRAFT", "PUBLISHED"]);
  await finishLesson(lesson!.id);
  await prisma.assessment.update({ where: { categoryId: lesson!.id }, data: { status: "PUBLISHED" } });

  assert.equal(await statusOf(lesson!.id), "completed");
  assert.equal(await statusOf(next!.id), "current");
});
