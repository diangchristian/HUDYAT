import express from "express";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";

// Routes
import authRouter from "./routes/auth.routes.js";
import categoriesRouter from "./routes/categories.routes.js";
import learningRouter from "./routes/learning.routes.js";

dotenv.config();
connectDB()

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/learning", learningRouter);
app.use("/api/categories", categoriesRouter);



const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
