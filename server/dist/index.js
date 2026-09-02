import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map