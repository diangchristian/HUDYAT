import { prisma } from "../config/db.js";
import { getLearningAreas } from "./learning.service.js";
export const getMyProgress = async (learnerId) => {
    const [areas, attempts] = await Promise.all([
        getLearningAreas(learnerId),
        prisma.assessmentAttempt.findMany({
            where: { learnerId, completedAt: { not: null } },
            orderBy: [{ completedAt: "desc" }, { id: "asc" }],
            select: {
                id: true, score: true, totalPoints: true, completedAt: true,
                assessment: { select: { categoryId: true } },
            },
        }),
    ]);
    const learningAreas = areas.filter((area) => area.isActive).map((area) => ({
        id: area.id,
        name: area.name,
        categories: area.categories.map((category) => {
            const categoryAttempts = attempts.filter((attempt) => attempt.assessment.categoryId === category.id);
            const latest = categoryAttempts[0];
            return {
                id: category.id,
                name: category.name,
                status: category.progress.status,
                progressPercent: category.progressPercent,
                completedAt: category.progress.completedAt,
                assessmentAttempts: categoryAttempts.length,
                latestAssessment: latest ? {
                    score: Number(latest.score),
                    totalPoints: Number(latest.totalPoints),
                    percentage: Number(latest.totalPoints) > 0
                        ? Math.round(Number(latest.score) / Number(latest.totalPoints) * 100)
                        : 0,
                    completedAt: latest.completedAt,
                } : null,
            };
        }),
    }));
    const categories = learningAreas.flatMap((area) => area.categories);
    return {
        summary: {
            totalCategories: categories.length,
            completedCategories: categories.filter((category) => category.status === "COMPLETED").length,
            inProgressCategories: categories.filter((category) => category.status === "IN_PROGRESS").length,
            assessmentAttempts: categories.reduce((total, category) => total + category.assessmentAttempts, 0),
        },
        learningAreas,
    };
};
//# sourceMappingURL=progress.service.js.map