import { Prisma } from "../generated/prisma/client.js";
import type {
  AssessmentQuestionType,
  AssessmentStatus,
} from "../generated/prisma/enums.js";
import { prisma } from "../config/db.js";
import { httpError } from "../utils/httpError.js";


const ASSESSMENT_STATUSES: AssessmentStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];
const QUESTION_TYPES: AssessmentQuestionType[] = [
  "IMAGE_GESTURE",
  "VIDEO_GESTURE",
];
const MIN_CHOICES = 2;
const MAX_CHOICES = 6;

const gestureSelect = {
  id: true,
  label: true,
  meaning: true,
  referenceImageUrl: true,
  referenceVideoUrl: true,
} as const;

/*
 * Every active category grouped by learning area, with a summary of
 * its assessment (or null when the category has none yet).
 */
export const listAssessments = async () => {
  const learningAreas = await prisma.learningArea.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          _count: { select: { gestures: true } },
          assessment: {
            include: {
              _count: {
                select: { questions: true, assessmentAttempts: true },
              },
            },
          },
        },
      },
    },
  });

  return learningAreas.map((area) => ({
    id: area.id,
    name: area.name,
    categories: area.categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      categoryDescription: category.description,
      categoryUpdatedAt: category.updatedAt,
      gestureCount: category._count.gestures,
      assessment: category.assessment
        ? {
            id: category.assessment.id,
            title: category.assessment.title,
            status: category.assessment.status,
            passingScore: Number(category.assessment.passingScore),
            questionCount: category.assessment._count.questions,
            attemptCount: category.assessment._count.assessmentAttempts,
            updatedAt: category.assessment.updatedAt,
          }
        : null,
    })),
  }));
};

const findCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      description: true,
      learningArea: { select: { id: true, name: true } },
    },
  });

  if (!category) {
    throw httpError(404, "Category not found.");
  }

  return category;
};

/*
 * The authoring view of a category's assessment. Unlike the learner
 * view this exposes which choice is correct: the one whose gesture
 * matches the question's target gesture.
 */
export const getAssessment = async (categoryId: string) => {
  const category = await findCategory(categoryId);

  const assessment = await prisma.assessment.findUnique({
    where: { categoryId },
    include: {
      _count: { select: { assessmentAttempts: true } },
      questions: {
        orderBy: { questionNumber: "asc" },
        include: {
          gesture: { select: gestureSelect },
          choices: {
            orderBy: { displayOrder: "asc" },
            include: { gesture: { select: gestureSelect } },
          },
        },
      },
    },
  });

  if (!assessment) {
    return { category, assessment: null };
  }

  const attemptCount = assessment._count.assessmentAttempts;

  return {
    category,
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      passingScore: Number(assessment.passingScore),
      status: assessment.status,
      attemptCount,
      /*
       * Once learners have attempted it, changing which gestures a
       * question asks about (or its points) would make old scores
       * meaningless, so only wording edits are allowed from then on.
       */
      isLocked: attemptCount > 0,
      updatedAt: assessment.updatedAt,
      questions: assessment.questions.map((question) => ({
        id: question.id,
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        questionType: question.questionType,
        points: Number(question.points),
        gesture: question.gesture,
        choices: question.choices.map((choice) => ({
          id: choice.id,
          choiceText: choice.choiceText,
          displayOrder: choice.displayOrder,
          gesture: choice.gesture,
          isCorrect: choice.gestureId === question.gestureId,
        })),
      })),
    },
  };
};

/*
 * Gestures a question in this category may ask about or offer as a
 * choice.
 */
export const getCategoryGestures = async (categoryId: string) => {
  await findCategory(categoryId);

  const categoryGestures = await prisma.categoryGesture.findMany({
    where: { categoryId },
    orderBy: { displayOrder: "asc" },
    select: { gesture: { select: gestureSelect } },
  });

  return categoryGestures.map((entry) => entry.gesture);
};

export type AssessmentInput = {
  title?: unknown;
  description?: unknown;
  passingScore?: unknown;
  status?: unknown;
};

export const saveAssessment = async (
  categoryId: string,
  teacherId: string,
  input: AssessmentInput,
) => {
  await findCategory(categoryId);

  const existing = await prisma.assessment.findUnique({
    where: { categoryId },
    include: {
      _count: { select: { questions: true, assessmentAttempts: true } },
    },
  });

  const data: {
    title?: string;
    description?: string | null;
    passingScore?: number;
    status?: AssessmentStatus;
  } = {};

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw httpError(400, "Title is required.");
    }
    data.title = input.title.trim();
  }

  if (input.description !== undefined) {
    if (input.description !== null && typeof input.description !== "string") {
      throw httpError(400, "Invalid description.");
    }
    data.description = input.description?.trim() || null;
  }

  if (input.passingScore !== undefined) {
    const passingScore = Number(input.passingScore);
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) {
      throw httpError(400, "Passing score must be a percentage from 0 to 100.");
    }
    data.passingScore = passingScore;
  }

  if (input.status !== undefined) {
    if (!ASSESSMENT_STATUSES.includes(input.status as AssessmentStatus)) {
      throw httpError(400, "Invalid status.");
    }
    data.status = input.status as AssessmentStatus;
  }

  // Past attempts were graded against the current passing score, so it
  // is frozen once learners have taken the quiz (like its questions).
  if (
    data.passingScore !== undefined &&
    existing &&
    existing._count.assessmentAttempts > 0 &&
    !new Prisma.Decimal(data.passingScore).equals(existing.passingScore)
  ) {
    throw httpError(409, LOCKED_PASSING_SCORE_MESSAGE);
  }

  if (data.status === "PUBLISHED" && (existing?._count.questions ?? 0) === 0) {
    throw httpError(400, "Add at least one question before publishing.");
  }

  if (existing) {
    await prisma.assessment.update({ where: { categoryId }, data });
  } else {
    if (!data.title) {
      throw httpError(400, "Title is required.");
    }

    await prisma.assessment.create({
      data: {
        categoryId,
        createdBy: teacherId,
        title: data.title,
        description: data.description ?? null,
        passingScore: data.passingScore ?? 80,
        status: data.status ?? "DRAFT",
      },
    });
  }

  return getAssessment(categoryId);
};

export type QuestionInput = {
  questionText?: unknown;
  questionType?: unknown;
  points?: unknown;
  gestureId?: unknown;
  choiceGestureIds?: unknown;
};

type ParsedQuestion = {
  questionText?: string;
  questionType?: AssessmentQuestionType;
  points?: number;
  gestureId?: string;
  choiceGestureIds?: string[];
};

const parseQuestionInput = async (
  categoryId: string,
  input: QuestionInput,
  { partial }: { partial: boolean },
): Promise<ParsedQuestion> => {
  const parsed: ParsedQuestion = {};

  if (input.questionText !== undefined || !partial) {
    if (typeof input.questionText !== "string" || !input.questionText.trim()) {
      throw httpError(400, "Question text is required.");
    }
    parsed.questionText = input.questionText.trim();
  }

  if (input.questionType !== undefined || !partial) {
    if (!QUESTION_TYPES.includes(input.questionType as AssessmentQuestionType)) {
      throw httpError(400, "Invalid question type.");
    }
    parsed.questionType = input.questionType as AssessmentQuestionType;
  }

  if (input.points !== undefined) {
    const points = Number(input.points);
    if (!Number.isFinite(points) || points <= 0) {
      throw httpError(400, "Points must be greater than 0.");
    }
    parsed.points = points;
  }

  const touchesGestures =
    input.gestureId !== undefined || input.choiceGestureIds !== undefined;

  if (touchesGestures || !partial) {
    // The target gesture and its choices are validated together:
    // the correct answer is whichever choice uses the target gesture.
    if (typeof input.gestureId !== "string") {
      throw httpError(400, "Pick the gesture this question asks about.");
    }

    if (
      !Array.isArray(input.choiceGestureIds) ||
      !input.choiceGestureIds.every((id) => typeof id === "string")
    ) {
      throw httpError(400, "Choices are required.");
    }

    const choiceGestureIds = input.choiceGestureIds as string[];

    if (
      choiceGestureIds.length < MIN_CHOICES ||
      choiceGestureIds.length > MAX_CHOICES
    ) {
      throw httpError(
        400,
        `A question needs between ${MIN_CHOICES} and ${MAX_CHOICES} choices.`,
      );
    }

    if (new Set(choiceGestureIds).size !== choiceGestureIds.length) {
      throw httpError(400, "Each choice must use a different gesture.");
    }

    if (!choiceGestureIds.includes(input.gestureId)) {
      throw httpError(400, "The correct gesture must be one of the choices.");
    }

    const allowed = await prisma.categoryGesture.count({
      where: { categoryId, gestureId: { in: choiceGestureIds } },
    });

    if (allowed !== choiceGestureIds.length) {
      throw httpError(400, "Choices must be gestures from this category.");
    }

    parsed.gestureId = input.gestureId;
    parsed.choiceGestureIds = choiceGestureIds;
  }

  return parsed;
};

/*
 * A video question plays the target sign's own reference video (there's
 * no per-question media), so that sign must actually have one.
 */
const assertVideoAvailable = async (
  questionType: AssessmentQuestionType,
  gestureId: string,
) => {
  if (questionType !== "VIDEO_GESTURE") return;

  const gesture = await prisma.fslGesture.findUnique({
    where: { id: gestureId },
    select: { label: true, referenceVideoUrl: true },
  });

  if (!gesture?.referenceVideoUrl) {
    throw httpError(
      400,
      `"${gesture?.label ?? "This sign"}" has no reference video, so it can't be a "Name the sign" video question. Switch it to "Pick the sign" or choose a different correct sign.`,
    );
  }
};

const buildChoices = async (gestureIds: string[]) => {
  const gestures = await prisma.fslGesture.findMany({
    where: { id: { in: gestureIds } },
    select: { id: true, label: true },
  });
  const labelById = new Map(gestures.map((gesture) => [gesture.id, gesture.label]));

  return gestureIds.map((gestureId, index) => ({
    gestureId,
    choiceText: labelById.get(gestureId) ?? null,
    displayOrder: index + 1,
  }));
};

const findEditableAssessment = async (categoryId: string) => {
  const assessment = await prisma.assessment.findUnique({
    where: { categoryId },
    include: { _count: { select: { assessmentAttempts: true } } },
  });

  if (!assessment) {
    throw httpError(404, "Create the assessment before adding questions.");
  }

  return {
    assessment,
    isLocked: assessment._count.assessmentAttempts > 0,
  };
};

const LOCKED_MESSAGE =
  "Learners have already taken this assessment, so only question wording can be changed.";
const LOCKED_PASSING_SCORE_MESSAGE =
  "Learners have already taken this assessment, so its passing score can't be changed.";

export const createQuestion = async (
  categoryId: string,
  input: QuestionInput,
) => {
  const { assessment, isLocked } = await findEditableAssessment(categoryId);

  if (isLocked) {
    throw httpError(409, LOCKED_MESSAGE);
  }

  const parsed = await parseQuestionInput(categoryId, input, { partial: false });
  await assertVideoAvailable(parsed.questionType!, parsed.gestureId!);
  const choices = await buildChoices(parsed.choiceGestureIds!);

  const last = await prisma.assessmentQuestion.findFirst({
    where: { assessmentId: assessment.id },
    orderBy: { questionNumber: "desc" },
    select: { questionNumber: true },
  });

  await prisma.assessmentQuestion.create({
    data: {
      assessmentId: assessment.id,
      gestureId: parsed.gestureId!,
      questionNumber: (last?.questionNumber ?? 0) + 1,
      questionText: parsed.questionText!,
      questionType: parsed.questionType!,
      points: parsed.points ?? 1,
      choices: { create: choices },
    },
  });

  return getAssessment(categoryId);
};

const findQuestion = async (assessmentId: string, questionId: string) => {
  const question = await prisma.assessmentQuestion.findFirst({
    where: { id: questionId, assessmentId },
  });

  if (!question) {
    throw httpError(404, "Question not found for this assessment.");
  }

  return question;
};

export const updateQuestion = async (
  categoryId: string,
  questionId: string,
  input: QuestionInput,
) => {
  const { assessment, isLocked } = await findEditableAssessment(categoryId);
  const existing = await findQuestion(assessment.id, questionId);

  const parsed = await parseQuestionInput(categoryId, input, { partial: true });

  const changesScoring =
    parsed.gestureId !== undefined ||
    parsed.points !== undefined ||
    parsed.questionType !== undefined;

  if (isLocked && changesScoring) {
    throw httpError(409, LOCKED_MESSAGE);
  }

  // Only re-check media when the type or target sign actually changes,
  // so re-saving an older question (e.g. to fix its wording) is never
  // blocked by a problem it already had.
  const nextType = parsed.questionType ?? existing.questionType;
  const nextGestureId = parsed.gestureId ?? existing.gestureId;
  if (
    nextType !== existing.questionType ||
    nextGestureId !== existing.gestureId
  ) {
    await assertVideoAvailable(nextType, nextGestureId);
  }

  const { choiceGestureIds, ...fields } = parsed;

  await prisma.$transaction(async (tx) => {
    await tx.assessmentQuestion.update({
      where: { id: questionId },
      data: fields,
    });

    if (choiceGestureIds) {
      await tx.questionChoice.deleteMany({ where: { questionId } });
      await tx.questionChoice.createMany({
        data: (await buildChoices(choiceGestureIds)).map((choice) => ({
          ...choice,
          questionId,
        })),
      });
    }
  });

  return getAssessment(categoryId);
};

export const deleteQuestion = async (
  categoryId: string,
  questionId: string,
) => {
  const { assessment, isLocked } = await findEditableAssessment(categoryId);

  if (isLocked) {
    throw httpError(409, LOCKED_MESSAGE);
  }

  const question = await findQuestion(assessment.id, questionId);

  await prisma.$transaction(async (tx) => {
    await tx.assessmentQuestion.delete({ where: { id: questionId } });

    // Close the numbering gap. Ascending order keeps every step
    // clear of the (assessmentId, questionNumber) unique constraint.
    const later = await tx.assessmentQuestion.findMany({
      where: {
        assessmentId: assessment.id,
        questionNumber: { gt: question.questionNumber },
      },
      orderBy: { questionNumber: "asc" },
      select: { id: true, questionNumber: true },
    });

    for (const entry of later) {
      await tx.assessmentQuestion.update({
        where: { id: entry.id },
        data: { questionNumber: entry.questionNumber - 1 },
      });
    }

    const remaining = await tx.assessmentQuestion.count({
      where: { assessmentId: assessment.id },
    });

    // A published assessment with no questions would be an empty quiz.
    if (remaining === 0 && assessment.status === "PUBLISHED") {
      await tx.assessment.update({
        where: { id: assessment.id },
        data: { status: "DRAFT" },
      });
    }
  });

  return getAssessment(categoryId);
};
