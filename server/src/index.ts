import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "fsl-pwa-server" });
});

app.get("/", (_req, res) => {
  res.json({ message: "FSL PWA API is running" });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
