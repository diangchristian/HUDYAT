import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });


const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected successfully via prisma");
    } catch (error: any) {
        console.error("Error connecting to the database:", error.message);
        process.exit(1); // Exit the process with an error code
    }
}

const disconnectDB = async () => {
    await prisma.$disconnect();
}

export { prisma, connectDB, disconnectDB };