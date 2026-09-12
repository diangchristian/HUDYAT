import "dotenv/config";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cloudinary } from "../../src/config/cloudinary.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const mediaRoot = path.resolve(scriptDir, "../../FSL-VIDEOS");
const dataRoot = path.resolve(scriptDir, "../data/learning");

type GestureData = {
  label: string;
  meaning: string;
  exampleUsage: string;
  displayOrder: number;
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
};

const NUMBER_WORDS: Record<string, string> = {
  "1": "One",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  "10": "Ten",
};

type CategoryConfig = {
  name: string;
  mediaDir: string;
  jsonFile: string;
  resourceType: "image" | "video";
  urlField: "referenceImageUrl" | "referenceVideoUrl";
  toCandidateLabel: (fileStem: string) => string | undefined;
};

const categories: CategoryConfig[] = [
  {
    name: "alphabet",
    mediaDir: path.join(mediaRoot, "Alphabet"),
    jsonFile: path.join(dataRoot, "alphabet.json"),
    resourceType: "image",
    urlField: "referenceImageUrl",
    toCandidateLabel: (stem) => stem,
  },
  {
    name: "numbers",
    mediaDir: path.join(mediaRoot, "Numbers"),
    jsonFile: path.join(dataRoot, "numbers.json"),
    resourceType: "image",
    urlField: "referenceImageUrl",
    toCandidateLabel: (stem) => NUMBER_WORDS[stem],
  },
  {
    name: "colors",
    mediaDir: path.join(mediaRoot, "Colors"),
    jsonFile: path.join(dataRoot, "colors.json"),
    resourceType: "video",
    urlField: "referenceVideoUrl",
    toCandidateLabel: (stem) => stem,
  },
];

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function processCategory(category: CategoryConfig) {
  const [files, raw] = await Promise.all([
    readdir(category.mediaDir),
    readFile(category.jsonFile, "utf-8"),
  ]);

  const gestures: GestureData[] = JSON.parse(raw);
  const matchedLabels = new Set<string>();

  for (const file of files) {
    const ext = path.extname(file);
    const stem = path.basename(file, ext);
    const candidateLabel = category.toCandidateLabel(stem);

    if (!candidateLabel) {
      console.warn(
        `[${category.name}] Skipping "${file}": no label mapping for "${stem}".`,
      );
      continue;
    }

    const gesture = gestures.find(
      (g) => g.label.toLowerCase() === candidateLabel.toLowerCase(),
    );

    if (!gesture) {
      console.warn(
        `[${category.name}] Skipping "${file}": no gesture found for label "${candidateLabel}".`,
      );
      continue;
    }

    const publicId = `fsl-pwa/${category.name}/${slugify(gesture.label)}`;
    const filePath = path.join(category.mediaDir, file);

    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      resource_type: category.resourceType,
      overwrite: true,
    });

    gesture[category.urlField] = result.secure_url;
    matchedLabels.add(gesture.label);

    console.log(
      `[${category.name}] Uploaded "${file}" -> ${gesture.label} (${result.secure_url})`,
    );
  }

  const unmatched = gestures.filter(
    (g) => !matchedLabels.has(g.label) && !g[category.urlField],
  );

  for (const gesture of unmatched) {
    console.warn(
      `[${category.name}] No media file found for gesture "${gesture.label}".`,
    );
  }

  await writeFile(
    category.jsonFile,
    `${JSON.stringify(gestures, null, 2)}\n`,
  );

  console.log(
    `[${category.name}] ${matchedLabels.size}/${gestures.length} gestures updated.`,
  );
}

async function main() {
  const requested = process.argv.slice(2);

  const validNames = categories.map((c) => c.name);

  const unknown = requested.filter(
    (name) => !validNames.includes(name),
  );

  for (const name of unknown) {
    console.warn(
      `Unknown category "${name}" — skipping. Valid categories: ${validNames.join(", ")}.`,
    );
  }

  const targets =
    requested.length > 0
      ? categories.filter((c) => requested.includes(c.name))
      : categories;

  for (const category of targets) {
    await processCategory(category);
  }
}

main().catch((error) => {
  console.error("Error uploading gesture media:", error);
  process.exit(1);
});
