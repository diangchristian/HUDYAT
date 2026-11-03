import { z } from "zod";

import { prisma } from "../config/db.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { recordAudit } from "./audit.service.js";

// Only web or site-relative links, since these end up in the UI's src attributes.
const SAFE_MEDIA_URL = /^(https?:\/\/|\/(?!\/))/i;

const mediaUrl = z
  .string()
  .trim()
  .max(2048, "Media links must be 2048 characters or fewer.")
  .refine(
    (url) => url === "" || SAFE_MEDIA_URL.test(url),
    "Media links must start with https://, http:// or /.",
  )
  .transform((url) => url || null)
  .nullable();

const lessonText = (name: string) =>
  z
    .string()
    .trim()
    .max(500, `${name} must be 500 characters or fewer.`)
    .transform((text) => text || null)
    .nullable();

const lessonInput = z.object({
  description: lessonText("Description").optional(),
  signs: z
    .array(
      z.object({
        id: z.string(),
        meaning: lessonText("Meaning"),
        exampleUsage: lessonText("When to use"),
        referenceImageUrl: mediaUrl,
        referenceVideoUrl: mediaUrl,
      }),
    )
    .optional(),
});

type SignMedia = {
  id: string;
  referenceImageUrl: string | null;
  referenceVideoUrl: string | null;
};

/*
 * Quiz screens get their media from the sign, so clearing it would break
 * them. Only a change is checked: media that was already missing shouldn't
 * block an unrelated edit.
 */
const assertMediaStillCoversQuizzes = async (
  sign: SignMedia,
  current: SignMedia,
) => {
  if (!sign.referenceVideoUrl && current.referenceVideoUrl) {
    const videoQuestions = await prisma.assessmentQuestion.count({
      where: { gestureId: sign.id, questionType: "VIDEO_GESTURE" },
    });
    if (videoQuestions > 0) {
      throw httpError(409, "A video quiz question uses this sign, so it needs a video.");
    }
  }

  if (!sign.referenceImageUrl && current.referenceImageUrl) {
    const imageChoices = await prisma.questionChoice.count({
      where: { gestureId: sign.id, question: { questionType: "IMAGE_GESTURE" } },
    });
    if (imageChoices > 0) {
      throw httpError(409, "An image quiz question uses this sign, so it needs an image.");
    }
  }
};

// Inactive lessons are hidden from teachers too, so they read as not found.
const findLesson = async (categoryId: string) => {
  const lesson = await prisma.category.findUnique({
    where: { id: categoryId, isActive: true },
    include: {
      learningArea: { select: { name: true } },
      gestures: {
        orderBy: { displayOrder: "asc" },
        include: { gesture: true },
      },
    },
  });
  if (!lesson) throw httpError(404, "Lesson not found.");
  return lesson;
};

export const getLesson = async (categoryId: string) => {
  const lesson = await findLesson(categoryId);

  return {
    id: lesson.id,
    name: lesson.name,
    description: lesson.description,
    areaName: lesson.learningArea.name,
    signs: lesson.gestures.map(({ gesture, exampleUsage }) => ({
      id: gesture.id,
      label: gesture.label,
      meaning: gesture.meaning,
      exampleUsage,
      referenceImageUrl: gesture.referenceImageUrl,
      referenceVideoUrl: gesture.referenceVideoUrl,
    })),
  };
};

export const updateLesson = async (
  actorId: string,
  categoryId: string,
  input: unknown,
) => {
  const { description, signs = [] } = parseInput(lessonInput, input);
  const lesson = await findLesson(categoryId);

  for (const sign of signs) {
    const current = lesson.gestures.find(({ gestureId }) => gestureId === sign.id);
    if (!current) {
      throw httpError(404, "That sign isn't part of this lesson.");
    }
    await assertMediaStillCoversQuizzes(sign, current.gesture);
  }

  await prisma.$transaction(async (tx) => {
    if (description !== undefined) {
      await tx.category.update({
        where: { id: lesson.id },
        data: { description },
      });
    }

    for (const sign of signs) {
      // The meaning and media belong to the sign; the example belongs to this lesson.
      await tx.fslGesture.update({
        where: { id: sign.id },
        data: {
          meaning: sign.meaning,
          referenceImageUrl: sign.referenceImageUrl,
          referenceVideoUrl: sign.referenceVideoUrl,
        },
      });
      await tx.categoryGesture.update({
        where: {
          categoryId_gestureId: { categoryId: lesson.id, gestureId: sign.id },
        },
        data: { exampleUsage: sign.exampleUsage },
      });
    }

    await recordAudit(tx, actorId, "LESSON_EDITED", "CATEGORY", lesson.id, lesson.name);
  });

  return getLesson(lesson.id);
};
