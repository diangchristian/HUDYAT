import * as progressService from "../services/progress.service.js";
export const getMyProgress = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const data = await progressService.getMyProgress(req.user.id);
        return res.status(200).json({ success: true, data });
    }
    catch {
        return res.status(500).json({
            success: false,
            message: "We couldn't load your progress right now.",
        });
    }
};
//# sourceMappingURL=progress.controller.js.map