import { type Request, type Response } from "express";
import * as teacherAssessmentService from "../services/teacher-assessment.service.js";
import * as teacherProgressService from "../services/teacher-progress.service.js";

/*
 * Every teacher endpoint has the same shape: run a service call,
 * wrap the result as `{ success, data }`, and translate thrown
 * `statusCode` errors (see the services) into responses.
 */
const serviceEndpoint =
  (
    run: (req: Request) => Promise<unknown>,
    fallbackMessage: string,
  ) =>
  async (req: Request, res: Response) => {
    try {
      const data = await run(req);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;

      if (!statusCode) {
        console.error(error);
      }

      return res.status(statusCode ?? 500).json({
        success: false,
        message:
          statusCode && error instanceof Error ? error.message : fallbackMessage,
      });
    }
  };

const categoryId = (req: Request) => req.params.categoryId as string;

export const getDashboard = serviceEndpoint(
  () => teacherProgressService.getDashboard(),
  "Unable to load the dashboard.",
);

export const listAssessments = serviceEndpoint(
  () => teacherAssessmentService.listAssessments(),
  "Unable to load assessments.",
);

export const getAssessment = serviceEndpoint(
  (req) => teacherAssessmentService.getAssessment(categoryId(req)),
  "Unable to load this assessment.",
);

export const saveAssessment = serviceEndpoint(
  (req) =>
    teacherAssessmentService.saveAssessment(
      categoryId(req),
      req.user!.id,
      req.body ?? {},
    ),
  "Unable to save this assessment.",
);

export const getCategoryGestures = serviceEndpoint(
  (req) => teacherAssessmentService.getCategoryGestures(categoryId(req)),
  "Unable to load gestures for this category.",
);

export const createQuestion = serviceEndpoint(
  (req) =>
    teacherAssessmentService.createQuestion(categoryId(req), req.body ?? {}),
  "Unable to add this question.",
);

export const updateQuestion = serviceEndpoint(
  (req) =>
    teacherAssessmentService.updateQuestion(
      categoryId(req),
      req.params.questionId as string,
      req.body ?? {},
    ),
  "Unable to update this question.",
);

export const deleteQuestion = serviceEndpoint(
  (req) =>
    teacherAssessmentService.deleteQuestion(
      categoryId(req),
      req.params.questionId as string,
    ),
  "Unable to delete this question.",
);

export const listLearners = serviceEndpoint(
  () => teacherProgressService.listLearners(),
  "Unable to load learners.",
);

export const getLearnerDetail = serviceEndpoint(
  (req) =>
    teacherProgressService.getLearnerDetail(req.params.learnerId as string),
  "Unable to load this learner.",
);
