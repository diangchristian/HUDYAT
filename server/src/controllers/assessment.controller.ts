import { type Request, type Response } from "express";
import * as assessmentService from "../services/assessment.service.js";

export const getAssessment = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const categoryId = req.params.categoryId as string;

  try {
    const assessment = await assessmentService.getAssessmentByCategory(
      categoryId,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number })?.statusCode ?? 404;

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load assessment.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const checkAnswer = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const categoryId = req.params.categoryId as string;
  const questionId = req.params.questionId as string;

  const { selectedChoiceId } = req.body as {
    selectedChoiceId?: string;
  };

  if (!selectedChoiceId) {
    return res.status(400).json({
      success: false,
      message: "selectedChoiceId is required.",
    });
  }

  try {
    const result = await assessmentService.checkAnswer(
      categoryId,
      req.user.id,
      questionId,
      selectedChoiceId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number })?.statusCode ?? 400;

    const message =
      error instanceof Error
        ? error.message
        : "Unable to check this answer.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const listAssessments = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const assessments = await assessmentService.getAssessmentsForLearner(
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load assessments.";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const submitAssessment = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const categoryId = req.params.categoryId as string;

  const { answers } = req.body as {
    answers?: Array<{
      questionId: string;
      selectedChoiceId: string;
    }>;
  };

  if (!Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      message: "Answers are required.",
    });
  }

  try {
    const result = await assessmentService.submitAssessment(
      categoryId,
      req.user.id,
      answers,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const statusCode =
      (error as { statusCode?: number })?.statusCode ?? 400;

    const message =
      error instanceof Error
        ? error.message
        : "Unable to submit assessment.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};
