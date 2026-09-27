import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/requireRole.js";
import { getMyProgress } from "../controllers/progress.controller.js";

const progressRouter = Router();
progressRouter.use(authMiddleware, requireRole("LEARNER"));
progressRouter.get("/", getMyProgress);
export default progressRouter;
