import {} from "express";
import * as learningService from "../services/learning.service.js";
export const getLearningAreas = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    try {
        const learningAreas = await learningService.getLearningAreas(req.user.id);
        return res.status(200).json({
            success: true,
            data: learningAreas,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to load learning areas.";
        return res.status(500).json({
            success: false,
            message,
        });
    }
};
export const getCategoryLesson = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    const categoryId = req.params.categoryId;
    try {
        const categoryLesson = await learningService.getCategoryLesson(categoryId, req.user.id);
        return res.status(200).json({
            success: true,
            data: categoryLesson,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to load category lesson.";
        return res.status(500).json({
            success: false,
            message,
        });
    }
};
export const saveLessonCheckpoint = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    const categoryId = req.params.categoryId;
    const { gestureIndex, lessonStep } = req.body;
    if (typeof gestureIndex !== "number" ||
        !Number.isInteger(gestureIndex) ||
        gestureIndex < 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid lesson position.",
        });
    }
    const validSteps = [
        "meaning",
        "context",
        "how",
        "try",
    ];
    if (!lessonStep ||
        !validSteps.includes(lessonStep)) {
        return res.status(400).json({
            success: false,
            message: "Invalid lesson step.",
        });
    }
    try {
        const progress = await learningService.saveLessonCheckpoint(categoryId, req.user.id, gestureIndex, lessonStep);
        return res.status(200).json({
            success: true,
            data: progress,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to save lesson progress.";
        return res.status(500).json({
            success: false,
            message,
        });
    }
};
//# sourceMappingURL=learning.controller.js.map