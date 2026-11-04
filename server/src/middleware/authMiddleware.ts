import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { type Request, type Response, type NextFunction } from "express";

const authenticateRequest =
  ({ allowPendingPasswordChange }: { allowPendingPasswordChange: boolean }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized, no token provided" });
    }

    try {
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload & {
        id?: string;
      };

      if (!decoded || typeof decoded === "string" || !decoded.id) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { learnerProfile: true, teacherProfile: true },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Checked on every request so deactivating ends existing sessions too.
      if (!user.isActive) {
        return res
          .status(401)
          .json({ message: "This account has been deactivated." });
      }

      if (user.mustChangePassword && !allowPendingPasswordChange) {
        return res.status(403).json({
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "Change your temporary password to continue.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

export const authMiddleware = authenticateRequest({
  allowPendingPasswordChange: false,
});

/** Only for the routes someone needs in order to replace a temporary password. */
export const authMiddlewareDuringPasswordChange = authenticateRequest({
  allowPendingPasswordChange: true,
});
