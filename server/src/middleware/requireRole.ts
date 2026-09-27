import { type Request, type Response, type NextFunction } from "express";
import type { UserRole } from "../generated/prisma/enums.js";

/*
 * Restricts a router (or route) to the given roles. Must run after
 * `authMiddleware`, which is what populates `req.user`.
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You don't have access to this resource.",
      });
    }

    next();
  };
