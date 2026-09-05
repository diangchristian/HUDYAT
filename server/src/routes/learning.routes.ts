import Router from "express";
import { getLearningAreas, getCategoryLesson } from "../controllers/learning.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const learningRouter = Router();

learningRouter.use(authMiddleware)

learningRouter.get("/areas", getLearningAreas)
learningRouter.get("/categories/:categoryId", getCategoryLesson)



export default learningRouter