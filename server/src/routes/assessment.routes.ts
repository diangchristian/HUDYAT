import Router from "express";

import {
  getAssessment,
  submitAssessment,
} from "../controllers/assessment.controller.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const assessmentRouter = Router();

assessmentRouter.use(authMiddleware);

assessmentRouter.get(
  "/categories/:categoryId",
  getAssessment,
);

assessmentRouter.post(
  "/categories/:categoryId/submit",
  submitAssessment,
);

export default assessmentRouter;