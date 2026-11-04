import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { prisma } from "../src/config/db.js";
import { LOGIN_PATH, PASSWORD, testContext } from "./helpers.js";

const ctx = testContext("content");

let adminToken: string;
let teacherToken: string;
let teacherId: string;

const tokenFor = async (role: keyof typeof LOGIN_PATH) => {
  const user = await ctx.createUser(role);
  const { data } = await ctx.request("POST", LOGIN_PATH[role], {
    body: { identifier: user.username, password: PASSWORD },
  });
  return { id: user.id, token: data.token as string };
};

before(async () => {
  await ctx.start();
  adminToken = (await tokenFor("ADMIN")).token;
  const teacher = await tokenFor("TEACHER");
  teacherToken = teacher.token;
  teacherId = teacher.id;
});
after(ctx.stop);

/** A learning area with two lessons, the first with one sign. */
const createArea = async () => {
  const label = ctx.unique("sign");
  const sign = await prisma.fslGesture.create({
    data: { label, modelClass: label },
  });
  const area = await prisma.learningArea.create({
    data: {
      name: ctx.unique("area"),
      categories: {
        create: [
          {
            name: "First",
            displayOrder: 1,
            gestures: { create: { gestureId: sign.id, displayOrder: 1 } },
          },
          { name: "Second", displayOrder: 2 },
        ],
      },
    },
    include: { categories: { orderBy: { displayOrder: "asc" } } },
  });

  return { sign, first: area.categories[0]!, second: area.categories[1]! };
};

test("lessons belong to teachers, so the admin API has no lesson routes", async () => {
  const { first } = await createArea();

  const list = await ctx.request("GET", "/api/admin/lessons", { token: adminToken });
  assert.equal(list.status, 404);

  const edit = await ctx.request("PATCH", `/api/admin/lessons/${first.id}`, {
    token: adminToken,
    body: { isActive: false },
  });
  assert.equal(edit.status, 404);
});

test("only admins can see the overview", async () => {
  const { status } = await ctx.request("GET", "/api/admin/overview", {
    token: teacherToken,
  });
  assert.equal(status, 403);
});

test("the overview counts accounts and lessons, and works out quiz pass rates", async () => {
  const totals = async () =>
    (await ctx.request("GET", "/api/admin/overview", { token: adminToken })).data;
  const before = await totals();

  await ctx.createUser("LEARNER", { isActive: false });
  await ctx.createUser("TEACHER");
  const { first, second, sign } = await createArea();
  await prisma.category.update({ where: { id: second.id }, data: { isActive: false } });

  const passing = await ctx.createUser("LEARNER");
  const failing = await ctx.createUser("LEARNER");
  const unfinished = await ctx.createUser("LEARNER");
  const nearMiss = await ctx.createUser("LEARNER");
  const completedAt = new Date();
  await prisma.assessment.create({
    data: {
      categoryId: first.id,
      createdBy: teacherId,
      title: "Quiz",
      passingScore: 70,
      assessmentAttempts: {
        create: [
          { learnerId: passing.id, score: 7, totalPoints: 10, completedAt },
          { learnerId: failing.id, score: 6, totalPoints: 10, completedAt },
          // 69.7% fails a 70% quiz, even though it rounds up to 70.
          { learnerId: nearMiss.id, score: 23, totalPoints: 33, completedAt },
          { learnerId: unfinished.id, score: 0, totalPoints: 10 },
        ],
      },
      questions: {
        create: {
          gestureId: sign.id,
          questionNumber: 1,
          questionText: "Pick the sign",
          questionType: "IMAGE_GESTURE",
        },
      },
    },
  });

  const now = await totals();
  assert.equal(now.learners.total - before.learners.total, 5);
  assert.equal(now.learners.active - before.learners.active, 4);
  assert.equal(now.teachers.total - before.teachers.total, 1);
  assert.equal(now.deactivatedAccounts - before.deactivatedAccounts, 1);
  assert.equal(now.lessons.total - before.lessons.total, 2);
  assert.equal(now.lessons.active - before.lessons.active, 1);

  const rate = now.passRates.find((row: { categoryId: string }) => row.categoryId === first.id);
  assert.equal(rate.lesson, "First");
  assert.equal(rate.attempts, 3);
  assert.equal(rate.passRate, 33);

  assert.ok(Array.isArray(now.recentActivity));
});
