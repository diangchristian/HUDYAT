import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = (userId: string, res: any) => {
    const payload = { id: userId };

    const token = jwt.sign(
        payload,
        env.jwtSecret,
        {
            expiresIn: env.jwtExpiresIn as NonNullable<
                SignOptions["expiresIn"]
            >,
        }
    );

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        maxAge: env.jwtCookieExpiresIn * 24 * 60 * 60 * 1000,
    });

    return token;
};