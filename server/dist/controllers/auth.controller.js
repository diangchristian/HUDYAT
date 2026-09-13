import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import {} from "express";
const toAuthUser = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.learnerProfile?.fullName ?? user.username,
    avatarKey: user.learnerProfile?.avatarKey ?? null,
});
export const register = async (req, res) => {
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
export const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: { email },
        include: { learnerProfile: true },
    });
    if (!user) {
        return res.status(400).json({
            message: "User not found",
        });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid password",
        });
    }
    if (user.role !== "LEARNER") {
        return res.status(403).json({
            message: "This login is for students. Please use the teacher or admin login.",
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
export const me = async (req, res) => {
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
export const updateProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    if (!req.user.learnerProfile) {
        return res.status(403).json({
            success: false,
            message: "Only student accounts have an editable profile.",
        });
    }
    const { fullName, avatarKey } = req.body;
    const data = {};
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
export const changePassword = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    const { currentPassword, newPassword } = req.body;
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
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, req.user.password);
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
export const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({
        status: "success",
        message: "User logged out successfully",
    });
};
//# sourceMappingURL=auth.controller.js.map