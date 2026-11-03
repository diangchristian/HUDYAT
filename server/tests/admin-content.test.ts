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

const createSign = (name: string) => {
  const label = ctx.unique(name);
  return prisma.fslGesture.create({
    data: {
      label,
      modelClass: label,
      referenceImageUrl: "/signs/original.png",
      referenceVideoUrl: "/signs/original.mp4",
    },
  });
};

/** A learning area with two lessons, the first with one sign. */
const createArea = async () => {
  const sign = await createSign("sign");
  const area = await prisma.learningArea.create({
    data: {
      name: ctx.unique("area"),
      categories: {
        create: [
          {
            name: "First",
            description: "Original",
            displayOrder: 1,
            gestures: { create: { gestureId: sign.id, displayOrder: 1 } },
          },
          { name: "Second", displayOrder: 2 },
        ],
      },
    },
    include: { categories: { orderBy: { displayOrder: "asc" } } },
  });

  return { area, sign, first: area.categories[0]!, second: area.categories[1]! };
};

const patchLesson = (id: string, body: unknown, token = adminToken) =>
  ctx.request("PATCH", `/api/admin/lessons/${id}`, { token, body });

const listArea = async (areaId: string) => {
  const { data } = await ctx.request("GET", "/api/admin/lessons", {
    token: adminToken,
  });
  return data.find((area: { id: string }) => area.id === areaId);
};

test("lessons are listed by learning area, including inactive ones and their signs", async () => {
  const { area, first, second, sign } = await createArea();
  await prisma.category.update({ where: { id: second.id }, data: { isActive: false } });

  const listed = await listArea(area.id);

  assert.deepEqual(
    listed.lessons.map((lesson: { id: string; isActive: boolean }) => [lesson.id, lesson.isActive]),
    [[first.id, true], [second.id, false]],
  );
  assert.deepEqual(listed.lessons[0].signs, [
    {
      id: sign.id,
      label: sign.label,
      referenceImageUrl: "/signs/original.png",
      referenceVideoUrl: "/signs/original.mp4",
    },
  ]);
});

test("an admin edits a lesson's details and sign media, and it's logged", async () => {
  const { area, first, sign } = await createArea();

  const saved = await patchLesson(first.id, {
    description: "Updated",
    isActive: false,
    signs: [
      {
        id: sign.id,
        referenceImageUrl: "https://example.com/new.png",
        referenceVideoUrl: "",
      },
    ],
  });
  assert.equal(saved.status, 200);

  const lesson = (await listArea(area.id)).lessons[0];
  assert.equal(lesson.description, "Updated");
  assert.equal(lesson.isActive, false);
  assert.equal(lesson.signs[0].referenceImageUrl, "https://example.com/new.png");
  assert.equal(lesson.signs[0].referenceVideoUrl, null);

  const { data } = await ctx.request("GET", "/api/admin/activity?action=LESSON_EDITED", {
    token: adminToken,
  });
  assert.equal(data.entries[0].target, "First");
});

test("moving a lesson onto a taken position swaps the two lessons", async () => {
  const { area, first, second } = await createArea();

  assert.equal((await patchLesson(first.id, { displayOrder: 2 })).status, 200);

  const { lessons } = await listArea(area.id);
  assert.deepEqual(
    lessons.map((lesson: { id: string; displayOrder: number }) => [lesson.id, lesson.displayOrder]),
    [[second.id, 1], [first.id, 2]],
  );

  // Both lessons moved, so both are logged.
  const { data } = await ctx.request("GET", "/api/admin/activity?action=LESSON_EDITED", {
    token: adminToken,
  });
  const logged = data.entries.slice(0, 2).map((entry: { target: string }) => entry.target);
  assert.deepEqual(logged.sort(), ["First", "Second"]);
});

test("a learner can't open or submit a deactivated lesson, even by direct link", async () => {
  const { first, sign } = await createArea();
  const learner = await ctx.createUser("LEARNER");
  const { data: session } = await ctx.request("POST", LOGIN_PATH.LEARNER, {
    body: { identifier: learner.username, password: PASSWORD },
  });
  const token = session.token as string;

  const assessment = await prisma.assessment.create({
    data: {
      categoryId: first.id,
      createdBy: teacherId,
      title: "Quiz",
      passingScore: 70,
      status: "PUBLISHED",
      questions: {
        create: {
          gestureId: sign.id,
          questionNumber: 1,
          questionText: "Pick the sign",
          questionType: "IMAGE_GESTURE",
          choices: { create: { gestureId: sign.id, displayOrder: 1 } },
        },
      },
    },
    include: { questions: { include: { choices: true } } },
  });
  const question = assessment.questions[0]!;
  const selectedChoiceId = question.choices[0]!.id;
  const answer = { questionId: question.id, selectedChoiceId };
  await prisma.categoryProgress.create({
    data: {
      learnerId: learner.id,
      categoryId: first.id,
      status: "COMPLETED",
      lessonCompletedAt: new Date(),
    },
  });

  const lessonPath = `/api/learning/categories/${first.id}`;
  const quizPath = `/api/assessments/categories/${first.id}`;
  const attempts = () =>
    Promise.all([
      ctx.request("GET", lessonPath, { token }),
      ctx.request("PATCH", `${lessonPath}/checkpoint`, {
        token,
        body: { gestureIndex: 0, lessonStep: "meaning" },
      }),
      ctx.request("GET", quizPath, { token }),
      ctx.request("POST", `${quizPath}/questions/${question.id}/check`, {
        token,
        body: { selectedChoiceId },
      }),
      ctx.request("POST", `${quizPath}/submit`, {
        token,
        body: { answers: [answer] },
      }),
    ]);

  // Guards the test itself: these all work while the lesson is active.
  assert.equal((await ctx.request("GET", lessonPath, { token })).status, 200);
  assert.equal((await ctx.request("GET", quizPath, { token })).status, 200);

  await patchLesson(first.id, { isActive: false });

  for (const response of await attempts()) {
    assert.ok(response.status >= 400, `got ${response.status}`);
  }
  assert.equal(
    await prisma.assessmentAttempt.count({ where: { assessmentId: assessment.id } }),
    0,
  );
});

test("invalid lesson edits are rejected and change nothing", async () => {
  const { area, first, sign } = await createArea();
  const otherSign = await createSign("other");

  const unsafeMedia = {
    signs: [{ id: sign.id, referenceImageUrl: "javascript:alert(1)", referenceVideoUrl: null }],
  };
  assert.equal((await patchLesson(first.id, unsafeMedia)).status, 400);
  assert.equal((await patchLesson(first.id, { displayOrder: 0 })).status, 400);
  assert.equal((await patchLesson(first.id, { displayOrder: 1.5 })).status, 400);

  const notInLesson = {
    description: "Should not save",
    signs: [{ id: otherSign.id, referenceImageUrl: "/a.png", referenceVideoUrl: "/a.mp4" }],
  };
  assert.equal((await patchLesson(first.id, notInLesson)).status, 404);

  assert.equal((await patchLesson("no-such-lesson", { isActive: true })).status, 404);

  const lesson = (await listArea(area.id)).lessons[0];
  assert.equal(lesson.description, "Original");
  assert.equal(lesson.signs[0].referenceImageUrl, "/signs/original.png");
});

test("media a quiz question needs can't be cleared", async () => {
  const { first, sign } = await createArea();
  await prisma.assessment.create({
    data: {
      categoryId: first.id,
      createdBy: teacherId,
      title: "Quiz",
      passingScore: 70,
      questions: {
        create: [
          {
            gestureId: sign.id,
            questionNumber: 1,
            questionText: "Name the sign",
            questionType: "VIDEO_GESTURE",
            choices: { create: { gestureId: sign.id, displayOrder: 1 } },
          },
          {
            gestureId: sign.id,
            questionNumber: 2,
            questionText: "Pick the sign",
            questionType: "IMAGE_GESTURE",
            choices: { create: { gestureId: sign.id, displayOrder: 1 } },
          },
        ],
      },
    },
  });

  const clearing = (changes: object) => ({
    signs: [
      {
        id: sign.id,
        referenceImageUrl: "/signs/original.png",
        referenceVideoUrl: "/signs/original.mp4",
        ...changes,
      },
    ],
  });

  assert.equal((await patchLesson(first.id, clearing({ referenceVideoUrl: "" }))).status, 409);
  assert.equal((await patchLesson(first.id, clearing({ referenceImageUrl: null }))).status, 409);
  assert.equal(
    (await patchLesson(first.id, clearing({ referenceVideoUrl: "/signs/replaced.mp4" }))).status,
    200,
  );
});

test("media that was already missing doesn't block unrelated lesson edits", async () => {
  const { area, first, sign } = await createArea();
  await prisma.fslGesture.update({
    where: { id: sign.id },
    data: { referenceImageUrl: null },
  });
  await prisma.assessment.create({
    data: {
      categoryId: first.id,
      createdBy: teacherId,
      title: "Quiz",
      passingScore: 70,
      questions: {
        create: {
          gestureId: sign.id,
          questionNumber: 1,
          questionText: "Pick the sign",
          questionType: "IMAGE_GESTURE",
          choices: { create: { gestureId: sign.id, displayOrder: 1 } },
        },
      },
    },
  });

  const saved = await patchLesson(first.id, {
    description: "Edited anyway",
    signs: [
      { id: sign.id, referenceImageUrl: "", referenceVideoUrl: "/signs/original.mp4" },
    ],
  });

  assert.equal(saved.status, 200);
  assert.equal((await listArea(area.id)).lessons[0].description, "Edited anyway");
});

test("only admins can edit lessons or see the overview", async () => {
  const { first } = await createArea();

  assert.equal((await patchLesson(first.id, { isActive: false }, teacherToken)).status, 403);
  assert.equal(
    (await ctx.request("GET", "/api/admin/overview", { token: teacherToken })).status,
    403,
  );
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
