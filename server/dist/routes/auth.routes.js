import Router from "express";
import { register, login, logout, me, updateProfile, changePassword, } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const authRouter = Router();
authRouter.get("/test", (req, res) => {
    res.status(200).json({ message: "Auth route is working" });
});
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, me);
authRouter.patch("/me", authMiddleware, updateProfile);
authRouter.post("/change-password", authMiddleware, changePassword);
export default authRouter;
//# sourceMappingURL=auth.routes.js.map