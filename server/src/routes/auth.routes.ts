import Router from "express";
import {
  login,
  teacherLogin,
  adminLogin,
  logout,
  me,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import {
  authMiddleware,
  authMiddlewareDuringPasswordChange,
} from "../middleware/authMiddleware.js";


const authRouter = Router();

authRouter.get("/test", (req, res) => {
    res.status(200).json({ message: "Auth route is working" });
})

authRouter.post("/login", login)
authRouter.post("/teacher/login", teacherLogin)
authRouter.post("/admin/login", adminLogin)
authRouter.post("/logout", logout)
authRouter.get("/me", authMiddlewareDuringPasswordChange, me)
authRouter.patch("/me", authMiddleware, updateProfile)
authRouter.post("/change-password", authMiddlewareDuringPasswordChange, changePassword)




export default authRouter;
