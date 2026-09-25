import { Router } from "express";

import {
  createQuestion,
  deleteQuestion,
  getAssessment,
  getCategoryGestures,
  getDashboard,
  getLearnerDetail,
  listAssessments,
  listLearners,
  saveAssessment,
  updateQuestion,
} from "../controllers/teacher.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const teacherRouter = Router();

teacherRouter.use(authMiddleware, requireRole("TEACHER"));

teacherRouter.get("/dashboard", getDashboard);

// Assessment authoring (one assessment per category)
teacherRouter.get("/assessments", listAssessments);
teacherRouter.get("/categories/:categoryId/assessment", getAssessment);
teacherRouter.put("/categories/:categoryId/assessment", saveAssessment);
teacherRouter.get("/categories/:categoryId/gestures", getCategoryGestures);
teacherRouter.post(
  "/categories/:categoryId/assessment/questions",
  createQuestion,
);
teacherRouter.patch(
  "/categories/:categoryId/assessment/questions/:questionId",
  updateQuestion,
);
teacherRouter.delete(
  "/categories/:categoryId/assessment/questions/:questionId",
  deleteQuestion,
);

// Learner progress
teacherRouter.get("/learners", listLearners);
teacherRouter.get("/learners/:learnerId", getLearnerDetail);

export default teacherRouter;
