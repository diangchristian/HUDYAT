import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getMyProgress } from "../controllers/progress.controller.js";

const progressRouter = Router();
progressRouter.use(authMiddleware);
progressRouter.get("/", getMyProgress);
export default progressRouter;
