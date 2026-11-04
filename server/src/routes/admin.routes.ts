import { Router } from "express";

import {
  createTeacher,
  getOverview,
  listActivity,
  listLearners,
  listTeachers,
  resetTeacherPassword,
  setLearnerStatus,
  setTeacherStatus,
  updateTeacher,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";

const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole("ADMIN"));

// Teacher accounts
adminRouter.get("/teachers", listTeachers);
adminRouter.post("/teachers", createTeacher);
adminRouter.patch("/teachers/:teacherId", updateTeacher);
adminRouter.post("/teachers/:teacherId/reset-password", resetTeacherPassword);
adminRouter.patch("/teachers/:teacherId/status", setTeacherStatus);

// Learner accounts: teachers create them and reset their passwords
adminRouter.get("/learners", listLearners);
adminRouter.patch("/learners/:learnerId/status", setLearnerStatus);

adminRouter.get("/overview", getOverview);
adminRouter.get("/activity", listActivity);

export default adminRouter;
