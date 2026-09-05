import {prisma} from "../config/db.js";
import { type Request, type Response, type NextFunction } from "express";
import * as learningService from "../services/learning.service.js";


export const getLearningAreas = async (req: Request, res: Response) => {

    const learningAreas = await learningService.getLearningAreas()

    res.status(200).json({
        success: true,
        data: learningAreas

    })


}


export const getCategoryLesson = async (req: Request, res: Response) => {
    const categoryId = req.params.categoryId

    const categoryLesson = await learningService.getCategoryLesson(categoryId as string)

    res.status(200).json({
        success: true,
        data: categoryLesson
    })

}