import Router from "express";

import {
  checkAnswer,
  getAssessment,
  listAssessments,
  submitAssessment,
  submitSignTest,
} from "../controllers/assessment.controller.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const assessmentRouter = Router();

assessmentRouter.use(authMiddleware, requireRole("LEARNER"));

assessmentRouter.get(
  "/",
  listAssessments,
);

assessmentRouter.get(
  "/categories/:categoryId",
  getAssessment,
);

assessmentRouter.post(
  "/categories/:categoryId/questions/:questionId/check",
  checkAnswer,
);

assessmentRouter.post(
  "/categories/:categoryId/submit",
  submitAssessment,
);

assessmentRouter.post(
  "/categories/:categoryId/sign-test",
  submitSignTest,
);

export default assessmentRouter;
