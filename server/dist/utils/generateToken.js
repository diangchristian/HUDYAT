import jwt from "jsonwebtoken";
export const generateToken = (userId, res) => {
    const payload = { id: userId };
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
//# sourceMappingURL=generateToken.js.map