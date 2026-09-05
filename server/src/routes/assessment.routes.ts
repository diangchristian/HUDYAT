import Router from "express";
import { getAllAssessments, getAssessmentById } from "../controllers/assessment.controller.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const assessmentRouter = Router();

assessmentRouter.use(authMiddleware)

assessmentRouter.get("/", getAllAssessments)
assessmentRouter.get("/:assessmentId", getAssessmentById)




export default assessmentRouter