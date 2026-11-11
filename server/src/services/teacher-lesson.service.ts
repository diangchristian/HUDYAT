import { z } from "zod";

import { cloudinary } from "../config/cloudinary.js";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";
import { parseInput } from "../utils/parseInput.js";
import { recordAudit } from "./audit.service.js";

const SAVE_TIMEOUT_MS = 20_000;

const UPLOAD_FOLDER = "fsl-pwa/teacher-uploads";

const UPLOAD_FORMATS = {
  image: "jpg,jpeg,png,webp",
  video: "mp4,mov,webm",
};

type MediaKind = keyof typeof UPLOAD_FORMATS;

const mediaUrl = z
  .string()
  .trim()
  .max(2048, "That media link is too long.")
  .transform((url) => url || null)
  .nullable();

const lessonText = (name: string) =>
  z
    .string()
    .trim()
    .max(500, `${name} must be 500 characters or fewer.`)
    .transform((text) => text || null)
    .nullable();

// One emoji (a ZWJ family, a flag or a keycap counts as one) or a few in a row; at least one real pictograph.
const EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|[0-9#*]\ufe0f?\u20e3|\u200d|\ufe0f|[\u{e0020}-\u{e007f}])+$/u;
const PICTOGRAPH = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u;

/** An emoji, or the https link of an uploaded image (checked against our Cloudinary later). */
const picture = z
  .string()
  .trim()
  .max(2048, "That picture link is too long.")
  .refine(
    (value) =>
      ([...value].length <= 32 && EMOJI.test(value) && PICTOGRAPH.test(value)) || value.startsWith("https://"),
    "Choose an emoji or upload a picture.",
  );

// Keys are lesson-text.ts's word keys: lower-case words (several for a sign's name), no punctuation.
const pictureMap = z
  .record(z.string().regex(/^[\p{L}\p{N}' -]{1,60}$/u, "A picture must belong to a word."), picture)
  .refine((pictures) => Object.keys(pictures).length <= 100, "That's too many pictures for one text.");

const INVALID_ORDER = "Order must be a whole number from 1.";

const lessonInput = z.object({
  description: lessonText("Description").optional(),
  displayOrder: z.number(INVALID_ORDER).int(INVALID_ORDER).min(1, INVALID_ORDER).optional(),
  isActive: z.boolean("Visibility must be true or false.").optional(),
  signs: z
    .array(
      z.object({
        id: z.string(),
        meaning: lessonText("Meaning"),
        exampleUsage: lessonText("When to use"),
        referenceImageUrl: mediaUrl,
        referenceVideoUrl: mediaUrl,
        // Optional: leaving them out keeps the current pictures.
        mainPicture: picture.nullable().optional(),
        meaningPictures: pictureMap.optional(),
        exampleUsagePictures: pictureMap.optional(),
      }),
    )
    .optional(),
});

type PictureMap = Record<string, string>;

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
  current: SignMedia & { label: string },
) => {
  if (!sign.referenceVideoUrl && current.referenceVideoUrl) {
    const videoQuestions = await prisma.assessmentQuestion.count({
      where: { gestureId: sign.id, questionType: "VIDEO_GESTURE" },
    });
    if (videoQuestions > 0) {
      throw httpError(
        409,
        `A video quiz question uses "${current.label}", so it needs a video. Upload a new one instead of removing it.`,
      );
    }
  }

  if (!sign.referenceImageUrl && current.referenceImageUrl) {
    const imageChoices = await prisma.questionChoice.count({
      where: { gestureId: sign.id, question: { questionType: "IMAGE_GESTURE" } },
    });
    if (imageChoices > 0) {
      throw httpError(
        409,
        `An image quiz question uses "${current.label}", so it needs an image. Upload a new one instead of removing it.`,
      );
    }
  }
};

/*
 * New media must be a file uploaded to our own Cloudinary account. Links
 * already on a sign can stay, since older media is hosted elsewhere.
 */
const assertUploadedMedia = (
  url: string | null,
  kind: MediaKind,
  currentUrl: string | null,
) => {
  const ourUploads = `https://res.cloudinary.com/${env.cloudinary.cloudName}/${kind}/upload/`;

  if (url && url !== currentUrl && !url.startsWith(ourUploads)) {
    throw httpError(400, `Please upload the ${kind} again.`);
  }
};

/** Same rule as media, for pictures: a new image must be our upload; ones the text already had may stay. */
const assertUploadedPictures = (pictures: string[], current: string[]) => {
  for (const url of pictures) {
    if (url.startsWith("https://")) {
      assertUploadedMedia(url, "image", current.includes(url) ? url : null);
    }
  }
};

/** Permission for one browser upload, so the file goes straight to Cloudinary. */
export const signMediaUpload = async (input: unknown) => {
  const { kind } = parseInput(
    z.object({ kind: z.enum(["image", "video"], "Choose an image or a video.") }),
    input,
  );

  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: UPLOAD_FOLDER,
    allowed_formats: UPLOAD_FORMATS[kind],
  };

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/${kind}/upload`,
    fields: {
      ...params,
      api_key: env.cloudinary.apiKey,
      signature: cloudinary.utils.api_sign_request(params, env.cloudinary.apiSecret),
    },
  };
};

const findLesson = async (categoryId: string) => {
  const lesson = await prisma.category.findUnique({
    where: { id: categoryId },
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
    displayOrder: lesson.displayOrder,
    isActive: lesson.isActive,
    areaName: lesson.learningArea.name,
    signs: lesson.gestures.map(({ gesture, exampleUsage, exampleUsagePictures }) => ({
      id: gesture.id,
      label: gesture.label,
      meaning: gesture.meaning,
      exampleUsage,
      referenceImageUrl: gesture.referenceImageUrl,
      referenceVideoUrl: gesture.referenceVideoUrl,
      mainPicture: gesture.mainPicture,
      meaningPictures: gesture.meaningPictures as PictureMap,
      exampleUsagePictures: exampleUsagePictures as PictureMap,
    })),
  };
};

export const updateLesson = async (
  actorId: string,
  categoryId: string,
  input: unknown,
) => {
  const { description, displayOrder, isActive, signs = [] } = parseInput(
    lessonInput,
    input,
  );
  const lesson = await findLesson(categoryId);

  for (const sign of signs) {
    const current = lesson.gestures.find(({ gestureId }) => gestureId === sign.id);
    if (!current) {
      throw httpError(404, "That sign isn't part of this lesson.");
    }
    assertUploadedMedia(sign.referenceImageUrl, "image", current.gesture.referenceImageUrl);
    assertUploadedMedia(sign.referenceVideoUrl, "video", current.gesture.referenceVideoUrl);
    assertUploadedPictures(
      // Each map's values separately: merging them by word would hide one when both texts share a word.
      [sign.mainPicture, ...Object.values(sign.meaningPictures ?? {}), ...Object.values(sign.exampleUsagePictures ?? {})].filter((p) => p != null),
      [
        current.gesture.mainPicture,
        ...Object.values(current.gesture.meaningPictures as PictureMap),
        ...Object.values(current.exampleUsagePictures as PictureMap),
      ].filter((p) => p != null),
    );
    await assertMediaStillCoversQuizzes(sign, current.gesture);
  }

  await prisma.$transaction(async (tx) => {
    if (displayOrder !== undefined && displayOrder !== lesson.displayOrder) {
      // Teachers see one numbered list across all learning areas, so numbers must stay unique.
      const holder = await tx.category.findFirst({ where: { displayOrder } });

      if (holder && holder.learningAreaId !== lesson.learningAreaId) {
        throw httpError(
          400,
          `Number ${displayOrder} is already used by "${holder.name}" in another learning area.`,
        );
      }

      if (holder) {
        // The order is unique per area, so step aside before swapping.
        await tx.category.update({
          where: { id: lesson.id },
          data: { displayOrder: -lesson.displayOrder },
        });
        await tx.category.update({
          where: { id: holder.id },
          data: { displayOrder: lesson.displayOrder },
        });
        await recordAudit(tx, actorId, "LESSON_EDITED", "CATEGORY", holder.id, holder.name);
      }
    }

    await tx.category.update({
      where: { id: lesson.id },
      data: {
        ...(description !== undefined && { description }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    for (const sign of signs) {
      // The meaning and media belong to the sign; the example belongs to this lesson.
      await tx.fslGesture.update({
        where: { id: sign.id },
        data: {
          meaning: sign.meaning,
          referenceImageUrl: sign.referenceImageUrl,
          referenceVideoUrl: sign.referenceVideoUrl,
          ...(sign.mainPicture !== undefined && { mainPicture: sign.mainPicture }),
          ...(sign.meaningPictures && { meaningPictures: sign.meaningPictures }),
        },
      });
      await tx.categoryGesture.update({
        where: {
          categoryId_gestureId: { categoryId: lesson.id, gestureId: sign.id },
        },
        data: {
          exampleUsage: sign.exampleUsage,
          ...(sign.exampleUsagePictures && { exampleUsagePictures: sign.exampleUsagePictures }),
        },
      });
    }

    await recordAudit(tx, actorId, "LESSON_EDITED", "CATEGORY", lesson.id, lesson.name);
    // Two statements per sign adds up on large lessons (Alphabet has 26), over a remote database.
  }, { timeout: SAVE_TIMEOUT_MS });

  return getLesson(lesson.id);
};
