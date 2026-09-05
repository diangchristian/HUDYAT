import {prisma} from "../config/db.js";
import { type Request, type Response, type NextFunction } from "express";
import * as assessmentService from "../services/assessment.service.js"


export const getAllAssessments = async (req: Request, res: Response, next: NextFunction) => {

    const allAssessment = await assessmentService.getAllAssessment()

    return res.status(200).json({
        sucess: true,
        data: allAssessment

    })

}


export const getAssessmentById = async (req: Request, res: Response, next: NextFunction) => {

    const assessment = await assessmentService.getAssessmentById(req.params.assessmentId as string)

    return res.status(200).json({
        sucess: true,
        data: assessment

    })

}



