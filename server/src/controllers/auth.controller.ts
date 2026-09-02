import {prisma} from "../config/db.js";
import bcrypt from "bcryptjs";
import {generateToken} from "../utils/generateToken.js";
import { type Request, type Response, type NextFunction } from "express";


export const register = async (req: Request, res: Response) => {
    const {username, email, password} = req.body;

    const userExist = await prisma.user.findUnique({ where: { email } });

    if(userExist){
        return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword
        }
    });

    const token = generateToken(user.id, res);

    res.status(201).json({ 
        status: "success", 
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        } 
    
    });

}


export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if(!user){
        return res.status(400).json({ message: "User not found" });
    } 

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(user.id, res);

    res.status(201).json({ 
        status: "success", 
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token,
        } 
    
    });
}


export const logout = async (req: Request, res: Response) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    })
    res.status(200).json({
        status: "success",
        message: "User logged out successfully"
    })
}