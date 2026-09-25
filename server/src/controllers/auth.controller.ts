import type { UserRole } from "../generated/prisma/enums.js";
import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import {
  type Request,
  type Response,
} from "express";

const toAuthUser = (user: {
  id: string;
  username: string;
  email: string | null;
  role: string;
  learnerProfile?: { fullName: string; avatarKey: string | null } | null;
  teacherProfile?: { fullName: string; contactNumber: string | null } | null;
}) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  fullName:
    user.learnerProfile?.fullName ??
    user.teacherProfile?.fullName ??
    user.username,
  avatarKey: user.learnerProfile?.avatarKey ?? null,
  contactNumber: user.teacherProfile?.contactNumber ?? null,
});

type PortalRole = Extract<UserRole, "LEARNER" | "TEACHER">;

const WRONG_PORTAL_MESSAGE: Record<PortalRole, string> = {
  LEARNER:
    "This login is for students. Please use the teacher or admin login.",
  TEACHER: "This login is for teachers. Please use the student login.",
};

/*
 * Shared credential check for every role's login endpoint. Each
 * portal only accepts its own role, so a student can't sign in
 * through the teacher login (and vice versa) even with valid
 * credentials.
 */
const authenticate = async (
  req: Request,
  res: Response,
  expectedRole: PortalRole,
) => {
  // The login forms label this field "Username", but accept either
  // a username or an email (older clients send it as `email`).
  const { identifier: rawIdentifier, email, password } = req.body as {
    identifier?: string;
    email?: string;
    password?: string;
  };
  const identifier = (rawIdentifier ?? email)?.trim();

  if (!identifier || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  // Both columns are unique; an exact email match wins so the lookup
  // is deterministic even if someone's username looks like an email.
  const include = { learnerProfile: true, teacherProfile: true } as const;
  const user =
    (await prisma.user.findUnique({ where: { email: identifier }, include })) ??
    (await prisma.user.findUnique({ where: { username: identifier }, include }));

  if (!user) {
    return res.status(400).json({
      message: "User not found",
    });
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid password",
    });
  }

  if (user.role !== expectedRole) {
    return res.status(403).json({
      message: WRONG_PORTAL_MESSAGE[expectedRole],
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      message: "This account has been deactivated.",
    });
  }

  const token = generateToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: toAuthUser(user),
      token,
    },
  });
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  console.log(username);

  const userExist = await prisma.user.findUnique({
    where: { email },
  });

  if (userExist) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: "LEARNER",

      learnerProfile: {
        create: {
          fullName: username,
        },
      },
    },
    include: { learnerProfile: true },
  });

  const token = generateToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: toAuthUser(user),
      token,
    },
  });
};

export const login = (req: Request, res: Response) =>
  authenticate(req, res, "LEARNER");

export const teacherLogin = (req: Request, res: Response) =>
  authenticate(req, res, "TEACHER");

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  res.status(200).json({
    success: true,
    data: toAuthUser(req.user),
  });
};

const MAX_FULL_NAME_LENGTH = 60;

export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  if (req.user.teacherProfile) {
    return updateTeacherProfile(req, res);
  }

  if (!req.user.learnerProfile) {
    return res.status(403).json({
      success: false,
      message: "This account doesn't have an editable profile.",
    });
  }

  const { fullName, avatarKey } = req.body as {
    fullName?: unknown;
    avatarKey?: unknown;
  };

  const data: { fullName?: string; avatarKey?: string | null } = {};

  if (fullName !== undefined) {
    if (typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Display name cannot be empty.",
      });
    }

    if (fullName.trim().length > MAX_FULL_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Display name must be ${MAX_FULL_NAME_LENGTH} characters or fewer.`,
      });
    }

    data.fullName = fullName.trim();
  }

  if (avatarKey !== undefined) {
    if (avatarKey !== null && typeof avatarKey !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid avatar selection.",
      });
    }

    data.avatarKey = avatarKey;
  }

  const updatedProfile = await prisma.learnerProfile.update({
    where: { userId: req.user.id },
    data,
  });

  return res.status(200).json({
    success: true,
    data: toAuthUser({ ...req.user, learnerProfile: updatedProfile }),
  });
};

const MAX_CONTACT_NUMBER_LENGTH = 20;

const updateTeacherProfile = async (req: Request, res: Response) => {
  const user = req.user!;

  const { fullName, contactNumber } = req.body as {
    fullName?: unknown;
    contactNumber?: unknown;
  };

  const data: { fullName?: string; contactNumber?: string | null } = {};

  if (fullName !== undefined) {
    if (typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Display name cannot be empty.",
      });
    }

    if (fullName.trim().length > MAX_FULL_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Display name must be ${MAX_FULL_NAME_LENGTH} characters or fewer.`,
      });
    }

    data.fullName = fullName.trim();
  }

  if (contactNumber !== undefined) {
    if (contactNumber !== null && typeof contactNumber !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid contact number.",
      });
    }

    const trimmed = contactNumber?.trim() ?? "";

    if (trimmed.length > MAX_CONTACT_NUMBER_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Contact number must be ${MAX_CONTACT_NUMBER_LENGTH} characters or fewer.`,
      });
    }

    data.contactNumber = trimmed || null;
  }

  const updatedProfile = await prisma.teacherProfile.update({
    where: { userId: user.id },
    data,
  });

  return res.status(200).json({
    success: true,
    data: toAuthUser({ ...user, teacherProfile: updatedProfile }),
  });
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current and new password are required.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters.",
    });
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    req.user.password as string,
  );

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  return res.status(200).json({
    success: true,
    data: { message: "Password updated successfully." },
  });
};

export const logout = async (req: Request, res: Response) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "User logged out successfully",
  });
};