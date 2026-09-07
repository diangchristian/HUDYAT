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
}) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
});

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

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

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

  if (user.role !== "LEARNER") {
    return res.status(403).json({
      message:
        "This login is for students. Please use the teacher or admin login.",
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