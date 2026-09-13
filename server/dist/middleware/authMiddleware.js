import jwt, {} from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import {} from "express";
export const authMiddleware = async (req, res, next) => {
    console.log("authMiddleware called");
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    }
    console.log(token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized, no token provided" });
    }
    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        if (!decoded || typeof decoded === "string" || !decoded.id) {
            return res.status(401).json({ message: "Invalid token payload" });
        }
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { learnerProfile: true },
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
//# sourceMappingURL=authMiddleware.js.map