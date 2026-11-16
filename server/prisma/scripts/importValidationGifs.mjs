import "dotenv/config";
import { readdir, mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Usage: node prisma/scripts/importValidationGifs.mjs <validation-folder> [--replace] [--apply]
// --replace updates all categories except Alphabet and Numbers, keeping legacy videos available.
const source = process.argv[2];
if (!source) throw new Error("Provide the validation folder.");
const apply = process.argv.includes("--apply");
const replace = process.argv.includes("--replace");
const repo = fileURLToPath(new URL("../../../", import.meta.url));
const database = new URL(process.env.LOCAL_DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
  throw new Error("LOCAL_DATABASE_URL must point to local PostgreSQL.");
}
const key = (value) => value.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const folders = new Map((await readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => [key(entry.name.replace(/^\d+\s*/, "")), entry.name]));
const db = new pg.Client({ connectionString: database.href });
await db.connect();
try {
  const { rows } = await db.query(`
    SELECT DISTINCT g.id, g.label, c.name AS category
    FROM fsl_gestures g
    JOIN category_gestures cg ON cg."gestureId" = g.id
    JOIN categories c ON c.id = cg."categoryId"
    WHERE ${replace ? "c.name NOT IN ('Alphabet', 'Numbers')" : "COALESCE(g.\"referenceImageUrl\", '') = '' AND COALESCE(g.\"referenceVideoUrl\", '') = ''"}
    ORDER BY c.name, g.label
  `);
  const plan = [];
  for (const sign of rows) {
    const folder = folders.get(key(sign.category));
    if (!folder) throw new Error(`No validation folder for ${sign.category}`);
    const files = (await readdir(path.join(source, folder))).filter((file) =>
      path.extname(file).toLowerCase() === ".gif" &&
      key(path.basename(file, path.extname(file)).replace(/^\d+\s*/, "")) === key(sign.label));
    if (files.length !== 1) throw new Error(`Expected one GIF for ${sign.category}/${sign.label}, found ${files.length}`);
    const relative = `references/validation/${key(sign.category)}/${key(sign.label)}.gif`;
    plan.push({ ...sign, source: path.join(source, folder, files[0]), relative, url: `/${relative}` });
  }
    console.log(JSON.stringify({ apply, replace, database: database.pathname, signs: plan.map(({ category, label, url }) => ({ category, label, url })) }, null, 2));
  if (apply) {
    // Copy first so every committed database URL has a file ready to serve.
    for (const sign of plan) {
      const target = path.join(repo, "client/public", sign.relative);
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(sign.source, target);
    }
    await db.query("BEGIN");
    try {
      for (const sign of plan) {
        await db.query(`UPDATE fsl_gestures SET "referenceImageUrl" = $1, "updatedAt" = NOW()
          WHERE id = $2 ${replace ? "" : "AND COALESCE(\"referenceImageUrl\", '') = '' AND COALESCE(\"referenceVideoUrl\", '') = ''"}`, [sign.url, sign.id]);
      }
      await db.query("COMMIT");
    } catch (error) { await db.query("ROLLBACK"); throw error; }
    // Preserve the imported references for future seeds, without replacing existing media.
    for (const category of new Set(plan.map((sign) => sign.category))) {
      const seedName = { "WH Questions": "wh-questions", "Word Concepts": "word-concepts" }[category] ?? key(category);
      const seedPath = path.join(repo, "server/prisma/data/learning", `${seedName}.json`);
      const seed = JSON.parse(await readFile(seedPath, "utf8"));
      for (const sign of plan.filter((item) => item.category === category)) {
        const entry = seed.find((item) => key(item.label) === key(sign.label) || (sign.label === "Violet" && item.label === "Purple"));
        if (entry && (replace || (!entry.referenceImageUrl && !entry.referenceVideoUrl))) entry.referenceImageUrl = sign.url;
      }
      await writeFile(seedPath, `${JSON.stringify(seed, null, 2)}\n`);
    }
    console.log(`Imported ${plan.length} GIF references.`);
  }
} finally { await db.end(); }
