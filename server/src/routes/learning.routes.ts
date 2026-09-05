import Router from "express";

import {
  getLearningAreas,
  getCategoryLesson,
  saveLessonCheckpoint,
} from "../controllers/learning.controller.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const learningRouter = Router();

learningRouter.use(authMiddleware);

learningRouter.get(
  "/areas",
  getLearningAreas,
);

learningRouter.get(
  "/categories/:categoryId",
  getCategoryLesson,
);

learningRouter.patch(
  "/categories/:categoryId/checkpoint",
  saveLessonCheckpoint,
);

export default learningRouter;