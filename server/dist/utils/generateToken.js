import jwt, {} from "jsonwebtoken";
import { env } from "../config/env.js";
export const generateToken = (userId, res) => {
    const payload = { id: userId };
    const token = jwt.sign(payload, env.jwtSecret, {
        expiresIn: env.jwtExpiresIn,
    });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        maxAge: env.jwtCookieExpiresIn * 24 * 60 * 60 * 1000,
    });
    return token;
};
//# sourceMappingURL=generateToken.js.map