import type { Prisma } from "../generated/prisma/client.js";

type AuthenticatedUser = Prisma.UserGetPayload<{
  include: { learnerProfile: true };
}>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
