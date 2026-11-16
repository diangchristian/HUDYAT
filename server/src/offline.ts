import "dotenv/config";

const localUrl = process.env.LOCAL_DATABASE_URL;
if (!localUrl) throw new Error("Set LOCAL_DATABASE_URL in server/.env first.");
const host = new URL(localUrl).hostname;
if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
  throw new Error("Offline mode requires a database on this computer.");
}

// Set this before importing the app, so every Prisma query uses local Postgres.
process.env.DATABASE_URL = localUrl;
console.log("Offline mode: using local PostgreSQL. Online media is unavailable without internet.");
await import("./index.js");
