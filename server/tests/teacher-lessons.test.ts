import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { prisma } from "../src/config/db.js";
import { LOGIN_PATH, PASSWORD, testContext } from "./helpers.js";

const ctx = testContext("tlessons");

let adminToken: string;
let teacherToken: string;
let teacherId: string;
let learnerToken: string;

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
  learnerToken = (await tokenFor("LEARNER")).token;
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

const createLesson = async () => {
  const sign = await createSign("sign");
  const area = await prisma.learningArea.create({
    data: {
      name: ctx.unique("area"),
      categories: {
        create: {
          name: "Lesson",
          description: "Original",
          displayOrder: 1,
          gestures: { create: { gestureId: sign.id, displayOrder: 1 } },
        },
      },
    },
    include: { categories: true },
  });

  return { sign, lesson: area.categories[0]! };
};

const addQuiz = (
  categoryId: string,
  gestureId: string,
  questionType: "IMAGE_GESTURE" | "VIDEO_GESTURE",
) =>
  prisma.assessment.create({
    data: {
      categoryId,
      createdBy: teacherId,
      title: "Quiz",
      passingScore: 70,
      questions: {
        create: {
          gestureId,
          questionNumber: 1,
          questionText: "Question",
          questionType,
          choices: { create: { gestureId, displayOrder: 1 } },
        },
      },
    },
  });

const lessonPath = (id: string) => `/api/teacher/lessons/${id}`;

const patchLesson = (id: string, body: unknown, token = teacherToken) =>
  ctx.request("PATCH", lessonPath(id), { token, body });

const getLesson = (id: string, token = teacherToken) =>
  ctx.request("GET", lessonPath(id), { token });

const signInput = (id: string, changes: object = {}) => ({
  id,
  meaning: "",
  exampleUsage: "",
  referenceImageUrl: "/signs/original.png",
  referenceVideoUrl: "/signs/original.mp4",
  ...changes,
});

test("a teacher's lesson edits are live for learners straight away", async () => {
  const { lesson, sign } = await createLesson();

  const saved = await patchLesson(lesson.id, {
    description: "Updated description",
    signs: [
      signInput(sign.id, {
        meaning: "A friendly greeting",
        exampleUsage: "When you meet a classmate",
        referenceImageUrl: "https://example.com/new.png",
        referenceVideoUrl: "/signs/new.mp4",
      }),
    ],
  });
  assert.equal(saved.status, 200);

  const { status, data } = await ctx.request(
    "GET",
    `/api/learning/categories/${lesson.id}`,
    { token: learnerToken },
  );
  assert.equal(status, 200);
  assert.equal(data.category.description, "Updated description");

  const taught = data.categoryGestures[0];
  assert.equal(taught.exampleUsage, "When you meet a classmate");
  assert.equal(taught.gesture.meaning, "A friendly greeting");
  assert.equal(taught.gesture.referenceImageUrl, "https://example.com/new.png");
  assert.equal(taught.gesture.referenceVideoUrl, "/signs/new.mp4");
});

test("a teacher loads a lesson's editable content, with empty text as null", async () => {
  const { lesson, sign } = await createLesson();
  await patchLesson(lesson.id, {
    signs: [signInput(sign.id, { meaning: "  Set  " })],
  });

  const { status, data } = await getLesson(lesson.id);

  assert.equal(status, 200);
  assert.equal(data.name, "Lesson");
  assert.equal(data.description, "Original");
  assert.deepEqual(data.signs, [
    {
      id: sign.id,
      label: sign.label,
      meaning: "Set",
      exampleUsage: null,
      referenceImageUrl: "/signs/original.png",
      referenceVideoUrl: "/signs/original.mp4",
    },
  ]);
});

test("lesson edits are logged with the teacher as the one who made them", async () => {
  const { lesson } = await createLesson();
  await patchLesson(lesson.id, { description: "Logged" });

  const { data } = await ctx.request(
    "GET",
    "/api/admin/activity?action=LESSON_EDITED",
    { token: adminToken },
  );

  assert.equal(data.entries[0].target, "Lesson");
  assert.equal(data.entries[0].actorRole, "TEACHER");
});

test("invalid edits are rejected and save nothing", async () => {
  const { lesson, sign } = await createLesson();
  const otherSign = await createSign("other");

  const cases: Array<[object, number]> = [
    [{ signs: [signInput(sign.id, { referenceImageUrl: "javascript:alert(1)" })] }, 400],
    [{ signs: [signInput(sign.id, { referenceVideoUrl: "//evil.example/a.mp4" })] }, 400],
    [{ signs: [signInput(sign.id, { meaning: "x".repeat(501) })] }, 400],
    [{ description: "x".repeat(501) }, 400],
    [{ description: "Should not save", signs: [signInput(otherSign.id)] }, 404],
  ];

  for (const [body, expected] of cases) {
    const { status, body: response } = await patchLesson(lesson.id, body);
    assert.equal(status, expected, JSON.stringify(body).slice(0, 80));
    assert.equal(typeof response.message, "string");
  }

  const { data } = await getLesson(lesson.id);
  assert.equal(data.description, "Original");
  assert.equal(data.signs[0].referenceImageUrl, "/signs/original.png");
});

test("media a quiz question needs can't be cleared", async () => {
  const video = await createLesson();
  await addQuiz(video.lesson.id, video.sign.id, "VIDEO_GESTURE");
  const clearVideo = await patchLesson(video.lesson.id, {
    signs: [signInput(video.sign.id, { referenceVideoUrl: "" })],
  });
  assert.equal(clearVideo.status, 409);

  const image = await createLesson();
  await addQuiz(image.lesson.id, image.sign.id, "IMAGE_GESTURE");
  const clearImage = await patchLesson(image.lesson.id, {
    signs: [signInput(image.sign.id, { referenceImageUrl: null })],
  });
  assert.equal(clearImage.status, 409);

  const replaced = await patchLesson(video.lesson.id, {
    signs: [signInput(video.sign.id, { referenceVideoUrl: "/signs/replaced.mp4" })],
  });
  assert.equal(replaced.status, 200);
});

test("media that was already missing doesn't block other edits", async () => {
  const { lesson, sign } = await createLesson();
  await prisma.fslGesture.update({
    where: { id: sign.id },
    data: { referenceImageUrl: null },
  });
  await addQuiz(lesson.id, sign.id, "IMAGE_GESTURE");

  const saved = await patchLesson(lesson.id, {
    signs: [signInput(sign.id, { referenceImageUrl: "", meaning: "Still editable" })],
  });

  assert.equal(saved.status, 200);
  assert.equal((await getLesson(lesson.id)).data.signs[0].meaning, "Still editable");
});

test("a teacher can't see or edit a lesson an admin deactivated", async () => {
  const { lesson } = await createLesson();
  await prisma.category.update({ where: { id: lesson.id }, data: { isActive: false } });

  assert.equal((await getLesson(lesson.id)).status, 404);
  assert.equal((await patchLesson(lesson.id, { description: "No" })).status, 404);
});

test("only teachers can use the lesson editor", async () => {
  const { lesson } = await createLesson();

  for (const token of [adminToken, learnerToken]) {
    assert.equal((await getLesson(lesson.id, token)).status, 403);
    assert.equal((await patchLesson(lesson.id, { description: "No" }, token)).status, 403);
  }
});
