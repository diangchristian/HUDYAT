import { Router } from "express";

import {
  createLearner,
  createQuestion,
  deleteQuestion,
  getAssessment,
  getCategoryGestures,
  getDashboard,
  getLearnerDetail,
  listAssessments,
  listLearners,
  resetLearnerPassword,
  saveAssessment,
  setLearnerStatus,
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

// Learner accounts
teacherRouter.post("/learners", createLearner);
teacherRouter.post("/learners/:learnerId/reset-password", resetLearnerPassword);
teacherRouter.patch("/learners/:learnerId/status", setLearnerStatus);

export default teacherRouter;
