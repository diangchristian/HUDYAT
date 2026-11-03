import { type Request } from "express";
import * as accountService from "../services/account.service.js";
import * as teacherAssessmentService from "../services/teacher-assessment.service.js";
import * as teacherProgressService from "../services/teacher-progress.service.js";
import { serviceEndpoint } from "../utils/serviceEndpoint.js";

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

export const createLearner = serviceEndpoint(
  (req) => accountService.createLearner(req.user!.id, req.body),
  "Unable to create this student.",
);

export const resetLearnerPassword = serviceEndpoint(
  (req) =>
    accountService.resetLearnerPassword(
      req.user!.id,
      req.params.learnerId as string,
      req.body,
    ),
  "Unable to reset this student's password.",
);

export const setLearnerStatus = serviceEndpoint(
  (req) =>
    accountService.setAccountStatus(
      req.user!.id,
      "LEARNER",
      req.params.learnerId as string,
      req.body,
    ),
  "Unable to update this student.",
);
