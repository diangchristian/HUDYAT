// Copies the online database (DATABASE_URL) into a local Postgres (LOCAL_DATABASE_URL),
// so the app can fall back to it without internet. Needs pg_dump/pg_restore on PATH.
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const source = process.env.DATABASE_URL;
const target = process.env.LOCAL_DATABASE_URL;

if (!source || !target) {
  throw new Error("Set both DATABASE_URL (online) and LOCAL_DATABASE_URL in server/.env");
}
if (/@(localhost|127\.0\.0\.1)[:/]/.test(source)) {
  throw new Error("DATABASE_URL points at a local database. Switch it back to Neon before backing up.");
}

// pg_dump is unreliable through Neon's connection pooler, so use the direct host.
const directSource = source.replace("-pooler.", ".");
const file = "backups/hudyat.dump";
mkdirSync("backups", { recursive: true });

console.log("Dumping online database...");
execFileSync("pg_dump", [directSource, "-Fc", "--no-owner", "--no-acl", "-f", file], { stdio: "inherit" });

console.log("Restoring into local database...");
execFileSync(
  "pg_restore",
  // --single-transaction: a failed restore rolls back instead of leaving a half-empty copy.
  ["-d", target, "--single-transaction", "--clean", "--if-exists", "--no-owner", "--no-acl", file],
  { stdio: "inherit" },
);

console.log(`Done. Local copy is up to date (dump kept at server/${file}).`);
