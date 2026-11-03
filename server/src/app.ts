import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routes
import modelsRouter from "./routes/models.routes.js";
import authRouter from "./routes/auth.routes.js";
import categoriesRouter from "./routes/categories.routes.js";
import learningRouter from "./routes/learning.routes.js";
import assessmentRouter from "./routes/assessment.routes.js";
import progressRouter from "./routes/progress.routes.js";
import teacherRouter from "./routes/teacher.routes.js";
import adminRouter from "./routes/admin.routes.js";

// Kept apart from index.ts so tests can run the app without its process handlers.
export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/models", modelsRouter);
app.use("/api/auth", authRouter);
app.use("/api/learning", learningRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/assessments", assessmentRouter);
app.use("/api/progress", progressRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/admin", adminRouter);
