import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

const uploaded = (kind: "image" | "video", file: string) =>
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${kind}/upload/v1/fsl-pwa/${file}`;

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
        referenceImageUrl: uploaded("image", "new.png"),
        referenceVideoUrl: uploaded("video", "new.mp4"),
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
  assert.equal(taught.gesture.referenceImageUrl, uploaded("image", "new.png"));
  assert.equal(taught.gesture.referenceVideoUrl, uploaded("video", "new.mp4"));
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

test("a lesson as large as Alphabet saves when every sign changes", async () => {
  const signs = [];
  for (let i = 0; i < 26; i += 1) signs.push(await createSign("big"));
  const area = await prisma.learningArea.create({
    data: {
      name: ctx.unique("area"),
      categories: {
        create: {
          name: "Big lesson",
          displayOrder: 1,
          gestures: {
            create: signs.map((sign, index) => ({
              gestureId: sign.id,
              displayOrder: index + 1,
            })),
          },
        },
      },
    },
    include: { categories: true },
  });
  const lesson = area.categories[0]!;

  const saved = await patchLesson(lesson.id, {
    signs: signs.map((sign) =>
      signInput(sign.id, { meaning: "Filled in", exampleUsage: "In class" }),
    ),
  });

  assert.equal(saved.status, 200, saved.body.message);
  const { data } = await getLesson(lesson.id);
  assert.equal(data.signs.length, 26);
  assert.ok(
    data.signs.every(
      (sign: { meaning: string; exampleUsage: string }) =>
        sign.meaning === "Filled in" && sign.exampleUsage === "In class",
    ),
  );
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
    [{ signs: [signInput(sign.id, { referenceImageUrl: "https://example.com/a.png" })] }, 400],
    [{ signs: [signInput(sign.id, { referenceImageUrl: "https://res.cloudinary.com/someone-else/image/upload/a.png" })] }, 400],
    [{ signs: [signInput(sign.id, { referenceImageUrl: uploaded("video", "a.mp4") })] }, 400],
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
  // A lesson can have many signs, so the message says which one to fix.
  assert.ok(clearVideo.body.message.includes(video.sign.label));

  const image = await createLesson();
  await addQuiz(image.lesson.id, image.sign.id, "IMAGE_GESTURE");
  const clearImage = await patchLesson(image.lesson.id, {
    signs: [signInput(image.sign.id, { referenceImageUrl: null })],
  });
  assert.equal(clearImage.status, 409);

  const replaced = await patchLesson(video.lesson.id, {
    signs: [signInput(video.sign.id, { referenceVideoUrl: uploaded("video", "replaced.mp4") })],
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

test("media already on a sign can stay when a teacher saves other changes", async () => {
  const { lesson, sign } = await createLesson();

  const saved = await patchLesson(lesson.id, {
    signs: [signInput(sign.id, { meaning: "Old links are untouched" })],
  });

  assert.equal(saved.status, 200);
});

test("a teacher gets a signed upload that Cloudinary can verify, without the secret", async () => {
  const { status, data, body } = await ctx.request("POST", "/api/teacher/media/signature", {
    token: teacherToken,
    body: { kind: "video" },
  });
  assert.equal(status, 200);
  assert.equal(
    data.uploadUrl,
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
  );
  assert.equal(data.fields.allowed_formats, "mp4,mov,webm");

  // Cloudinary's documented scheme: sorted params joined with &, then the secret, then SHA-1.
  const { allowed_formats, folder, timestamp, signature } = data.fields;
  const expected = createHash("sha1")
    .update(
      `allowed_formats=${allowed_formats}&folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`,
    )
    .digest("hex");
  assert.equal(signature, expected);

  assert.equal(JSON.stringify(body).includes(process.env.CLOUDINARY_API_SECRET!), false);
});

test("uploads only allow images and videos, and only teachers can start one", async () => {
  const path = "/api/teacher/media/signature";

  const image = await ctx.request("POST", path, {
    token: teacherToken,
    body: { kind: "image" },
  });
  assert.equal(image.data.fields.allowed_formats, "jpg,jpeg,png,webp");

  const raw = await ctx.request("POST", path, {
    token: teacherToken,
    body: { kind: "raw" },
  });
  assert.equal(raw.status, 400);

  for (const token of [adminToken, learnerToken]) {
    const refused = await ctx.request("POST", path, { token, body: { kind: "image" } });
    assert.equal(refused.status, 403);
  }
});

test("moving a lesson onto a taken position swaps the two, and logs both", async () => {
  const area = await prisma.learningArea.create({
    data: {
      name: ctx.unique("area"),
      categories: {
        create: [
          { name: "Swap first", displayOrder: 1 },
          { name: "Swap second", displayOrder: 2 },
        ],
      },
    },
    include: { categories: { orderBy: { displayOrder: "asc" } } },
  });
  const [first, second] = area.categories;

  assert.equal((await patchLesson(first!.id, { displayOrder: 2 })).status, 200);

  assert.equal((await getLesson(first!.id)).data.displayOrder, 2);
  assert.equal((await getLesson(second!.id)).data.displayOrder, 1);

  const { data } = await ctx.request(
    "GET",
    "/api/admin/activity?action=LESSON_EDITED",
    { token: adminToken },
  );
  const logged = data.entries.slice(0, 2).map((entry: { target: string }) => entry.target);
  assert.deepEqual(logged.sort(), ["Swap first", "Swap second"]);
});

test("an invalid lesson order is rejected", async () => {
  const { lesson } = await createLesson();

  for (const displayOrder of [0, 1.5, "2"]) {
    assert.equal((await patchLesson(lesson.id, { displayOrder })).status, 400);
  }
});

test("a teacher can hide a lesson, keep working on it, and bring it back", async () => {
  const { lesson } = await createLesson();
  const findListedLesson = async () => {
    const { data } = await ctx.request("GET", "/api/teacher/assessments", {
      token: teacherToken,
    });
    const categories = data.flatMap((area: { categories: object[] }) => area.categories);
    return categories.find(
      (category: { categoryId?: string }) => category.categoryId === lesson.id,
    );
  };

  assert.equal((await patchLesson(lesson.id, { isActive: false })).status, 200);

  assert.equal((await findListedLesson()).isActive, false);
  assert.equal((await getLesson(lesson.id)).data.isActive, false);
  assert.equal((await patchLesson(lesson.id, { description: "Getting ready" })).status, 200);
  assert.equal(
    (await ctx.request("GET", `/api/learning/categories/${lesson.id}`, { token: learnerToken })).status >= 400,
    true,
  );

  assert.equal((await patchLesson(lesson.id, { isActive: true })).status, 200);

  assert.equal((await findListedLesson()).isActive, true);
  const restored = await ctx.request("GET", `/api/learning/categories/${lesson.id}`, {
    token: learnerToken,
  });
  assert.equal(restored.status, 200);
  assert.equal(restored.data.category.description, "Getting ready");
});

test("a learner can't open or submit a hidden lesson, even by direct link", async () => {
  const { lesson, sign } = await createLesson();
  const learner = await ctx.createUser("LEARNER");
  const { data: session } = await ctx.request("POST", LOGIN_PATH.LEARNER, {
    body: { identifier: learner.username, password: PASSWORD },
  });
  const token = session.token as string;

  const assessment = await prisma.assessment.create({
    data: {
      categoryId: lesson.id,
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
  await prisma.categoryProgress.create({
    data: {
      learnerId: learner.id,
      categoryId: lesson.id,
      status: "COMPLETED",
      lessonCompletedAt: new Date(),
    },
  });

  const learnPath = `/api/learning/categories/${lesson.id}`;
  const quizPath = `/api/assessments/categories/${lesson.id}`;

  // Guards the test itself: these work while the lesson is visible.
  assert.equal((await ctx.request("GET", learnPath, { token })).status, 200);
  assert.equal((await ctx.request("GET", quizPath, { token })).status, 200);

  await patchLesson(lesson.id, { isActive: false });

  const attempts = await Promise.all([
    ctx.request("GET", learnPath, { token }),
    ctx.request("PATCH", `${learnPath}/checkpoint`, {
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
      body: { answers: [{ questionId: question.id, selectedChoiceId }] },
    }),
  ]);

  for (const response of attempts) {
    assert.ok(response.status >= 400, `got ${response.status}`);
  }
  assert.equal(
    await prisma.assessmentAttempt.count({ where: { assessmentId: assessment.id } }),
    0,
  );
});

test("only teachers can use the lesson editor", async () => {
  const { lesson } = await createLesson();

  for (const token of [adminToken, learnerToken]) {
    assert.equal((await getLesson(lesson.id, token)).status, 403);
    assert.equal((await patchLesson(lesson.id, { description: "No" }, token)).status, 403);
  }
});
