import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { prisma } from "../src/config/db.js";
import { LOGIN_PATH, PASSWORD, testContext } from "./helpers.js";

const ctx = testContext("signtest");

let learnerId: string;
let learnerToken: string;
let teacherId: string;
let teacherToken: string;

const login = async (role: keyof typeof LOGIN_PATH) => {
  const user = await ctx.createUser(role);
  const { data } = await ctx.request("POST", LOGIN_PATH[role], {
    body: { identifier: user.username, password: PASSWORD },
  });
  return { id: user.id, token: data.token as string };
};

before(async () => {
  await ctx.start();
  ({ id: learnerId, token: learnerToken } = await login("LEARNER"));
  ({ id: teacherId, token: teacherToken } = await login("TEACHER"));
});
after(ctx.stop);

/** A lesson with three signs and a quiz. Its name decides whether a camera model exists ("Colors" has one, a made-up name has none). */
const createLesson = async (name: string) => {
  const signs = await Promise.all(
    ["a", "b", "c"].map((letter) => {
      const label = ctx.unique(letter);
      return prisma.fslGesture.create({ data: { label, modelClass: label } });
    }),
  );
  const area = await prisma.learningArea.create({
    data: {
      name: ctx.unique("area"),
      categories: {
        create: {
          name,
          displayOrder: 1,
          gestures: { create: signs.map((sign, i) => ({ gestureId: sign.id, displayOrder: i + 1 })) },
          assessment: {
            create: { title: "Quiz", passingScore: 70, status: "PUBLISHED", createdBy: teacherId },
          },
        },
      },
    },
    include: { categories: { include: { assessment: true } } },
  });
  const lesson = area.categories[0]!;
  return { lesson, signs, assessmentId: lesson.assessment!.id };
};

const passQuiz = (assessmentId: string) =>
  prisma.assessmentAttempt.create({
    data: { assessmentId, learnerId, score: 1, totalPoints: 1, completedAt: new Date() },
  });

const takeSignTest = (categoryId: string, missedGestureIds: unknown, token = learnerToken) =>
  ctx.request("POST", `/api/assessments/categories/${categoryId}/sign-test`, {
    token,
    body: { missedGestureIds },
  });

const signTestOnList = async (categoryId: string) => {
  const { data } = await ctx.request("GET", "/api/assessments", { token: learnerToken });
  return data.learningAreas
    .flatMap((area: { categories: Array<{ categoryId: string; signTest: unknown }> }) => area.categories)
    .find((category: { categoryId: string }) => category.categoryId === categoryId).signTest;
};

test("after passing the quiz a learner takes the sign test; the best go is kept and teachers see it", async () => {
  const { lesson, signs, assessmentId } = await createLesson("Colors");
  await passQuiz(assessmentId);

  const first = await takeSignTest(lesson.id, [signs[0]!.id]);
  assert.equal(first.status, 200);
  // 80% of 3 signs rounds up to 3, so missing one is not a pass.
  assert.deepEqual(first.data, { score: 2, total: 3, passed: false, lessonCompleted: false });

  const second = await takeSignTest(lesson.id, []);
  assert.deepEqual(second.data, { score: 3, total: 3, passed: true, lessonCompleted: true });

  // A worse go later doesn't replace the best one.
  await takeSignTest(lesson.id, [signs[1]!.id, signs[2]!.id]);

  assert.deepEqual(await signTestOnList(lesson.id), {
    hasModel: true,
    available: true,
    best: { score: 3, total: 3, passed: true },
  });

  const { data } = await ctx.request("GET", `/api/teacher/learners/${learnerId}`, { token: teacherToken });
  const result = data.signTests.find((row: { categoryId: string }) => row.categoryId === lesson.id);
  assert.deepEqual(
    { score: result.score, total: result.total, missedSigns: result.missedSigns, attempts: result.attempts },
    { score: 3, total: 3, missedSigns: [], attempts: 3 },
  );
});

test("teachers see which signs were missed on the best go", async () => {
  const { lesson, signs, assessmentId } = await createLesson("Colors");
  await passQuiz(assessmentId);
  await takeSignTest(lesson.id, [signs[2]!.id]);

  const { data } = await ctx.request("GET", `/api/teacher/learners/${learnerId}`, { token: teacherToken });
  const result = data.signTests.find((row: { categoryId: string }) => row.categoryId === lesson.id);
  assert.deepEqual(result.missedSigns, [signs[2]!.label]);
});

test("the sign test opens only after the quiz is passed, and only where the camera has a model", async () => {
  const notPassed = await createLesson("Colors");
  assert.equal((await takeSignTest(notPassed.lesson.id, [])).status, 409);
  // The card still shows the Sign test step ahead, so it needs to know the camera can check this lesson.
  assert.deepEqual(await signTestOnList(notPassed.lesson.id), { hasModel: true, available: false, best: null });

  const noModel = await createLesson(ctx.unique("No camera model"));
  await passQuiz(noModel.assessmentId);
  assert.equal((await takeSignTest(noModel.lesson.id, [])).status, 409);
  assert.deepEqual(await signTestOnList(noModel.lesson.id), { hasModel: false, available: false, best: null });

  // A quiz taken back out of publishing hides its Sign test too.
  const unpublished = await createLesson("Colors");
  await passQuiz(unpublished.assessmentId);
  await prisma.assessment.update({ where: { id: unpublished.assessmentId }, data: { status: "DRAFT" } });
  assert.equal((await takeSignTest(unpublished.lesson.id, [])).status, 409);

  assert.equal(
    await prisma.signTestAttempt.count({
      where: { categoryId: { in: [notPassed.lesson.id, noModel.lesson.id, unpublished.lesson.id] } },
    }),
    0,
  );
});

test("a sign test can only miss signs of its own lesson", async () => {
  const { lesson, assessmentId } = await createLesson("Colors");
  const other = await createLesson("Colors");
  await passQuiz(assessmentId);

  for (const missed of [[other.signs[0]!.id], "all", [42]]) {
    const { status, body } = await takeSignTest(lesson.id, missed);
    assert.equal(status, 400, JSON.stringify(missed));
    assert.equal(typeof body.message, "string");
  }
  assert.equal((await takeSignTest("not-a-lesson", [])).status, 404);
  assert.equal((await takeSignTest(lesson.id, [], teacherToken)).status, 403);
});

/** Arranges a finished lesson with a one-question quiz, then answers it right over HTTP. */
const passQuizOverHttp = async ({ lesson, signs, assessmentId }: Awaited<ReturnType<typeof createLesson>>) => {
  const question = await prisma.assessmentQuestion.create({
    data: {
      assessmentId,
      gestureId: signs[0]!.id,
      questionNumber: 1,
      questionText: "Pick the sign",
      questionType: "IMAGE_GESTURE",
      choices: { create: signs.map((sign, i) => ({ gestureId: sign.id, displayOrder: i + 1 })) },
    },
    include: { choices: true },
  });
  await prisma.categoryProgress.create({
    data: { learnerId, categoryId: lesson.id, status: "IN_PROGRESS", lessonCompletedAt: new Date() },
  });
  const right = question.choices.find((choice) => choice.gestureId === signs[0]!.id)!;
  return ctx.request("POST", `/api/assessments/categories/${lesson.id}/submit`, {
    token: learnerToken,
    body: { answers: [{ questionId: question.id, selectedChoiceId: right.id }] },
  });
};

const learnStatus = async (categoryId: string) => {
  const { data } = await ctx.request("GET", "/api/learning/areas", { token: learnerToken });
  return data
    .flatMap((area: { categories: Array<{ id: string; learningStatus: string }> }) => area.categories)
    .find((category: { id: string }) => category.id === categoryId).learningStatus;
};

test("a lesson the camera can check completes only once both its quiz and its Sign test are passed", async () => {
  const lessonWithModel = await createLesson("Colors");

  const quiz = await passQuizOverHttp(lessonWithModel);
  assert.equal(quiz.status, 200);
  assert.equal(quiz.data.passed, true);
  assert.equal(quiz.data.lessonCompleted, false);
  assert.notEqual(await learnStatus(lessonWithModel.lesson.id), "completed");

  const missedOne = await takeSignTest(lessonWithModel.lesson.id, [lessonWithModel.signs[0]!.id]);
  assert.equal(missedOne.data.lessonCompleted, false);

  const passed = await takeSignTest(lessonWithModel.lesson.id, []);
  assert.equal(passed.data.lessonCompleted, true);
  assert.equal(await learnStatus(lessonWithModel.lesson.id), "completed");
});

test("a lesson the camera can't check completes on its quiz alone", async () => {
  const noModel = await createLesson(ctx.unique("No camera model"));
  const quiz = await passQuizOverHttp(noModel);
  assert.equal(quiz.data.lessonCompleted, true);
  assert.equal(await learnStatus(noModel.lesson.id), "completed");
});
