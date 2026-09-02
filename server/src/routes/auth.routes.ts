import Router from "express";
import { register, login, logout } from "../controllers/auth.controller.js";


const authRouter = Router();

authRouter.get("/test", (req, res) => {
    res.status(200).json({ message: "Auth route is working" });
})

authRouter.post("/register", register) 
authRouter.post("/login", login) 
authRouter.post("/logout", logout) 




export default authRouter;