import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

import alphabet from "../data/learning/alphabet.json";
import numbers from "../data/learning/numbers.json";
import greetings from "../data/learning/greetings.json";
import colors from "../data/learning/colors.json";
import { DABEST_CATEGORIES, isShownSign } from "../../src/config/dabest.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
});

type GestureData = {
  label: string;
  meaning: string;
  exampleUsage: string;
  displayOrder: number;
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
};

async function seedCategoryGestures(
  categoryName: string,
  gestures: GestureData[],
) {
  const category = await prisma.category.findFirst({
    where: {
      name: categoryName,
    },
  });

  if (!category) {
    throw new Error(
      `Category "${categoryName}" not found. Run the categories seeder first.`,
    );
  }

  for (const gesture of gestures) {
    // Find or create the FSL gesture
    const fslGesture = await prisma.fslGesture.upsert({
      where: {
        label: gesture.label,
      },

      update: {
        meaning: gesture.meaning,
        referenceImageUrl: gesture.referenceImageUrl,
        referenceVideoUrl: gesture.referenceVideoUrl,
      },

      create: {
        label: gesture.label,
        meaning: gesture.meaning,
        modelClass: gesture.label,
        isValidated: false,
        referenceImageUrl: gesture.referenceImageUrl,
        referenceVideoUrl: gesture.referenceVideoUrl,
      },
    });

    // Connect the gesture to the category
    await prisma.categoryGesture.upsert({
      where: {
        categoryId_gestureId: {
          categoryId: category.id,
          gestureId: fslGesture.id,
        },
      },

      update: {
        exampleUsage: gesture.exampleUsage,
        displayOrder: gesture.displayOrder,
      },

      create: {
        categoryId: category.id,
        gestureId: fslGesture.id,
        exampleUsage: gesture.exampleUsage,
        displayOrder: gesture.displayOrder,
      },
    });
  }

  console.log(
    `✓ ${categoryName}: ${gestures.length} gestures seeded`,
  );
}

// DABEST: the signs of its four categories (the other categories' data files are not seeded).
const SIGNS: Record<string, GestureData[]> = {
  Alphabet: alphabet,
  Numbers: numbers,
  Greetings: greetings,
  Colors: colors,
};

async function main() {
  for (const name of DABEST_CATEGORIES) {
    // In Colors only the six colors the Colors model knows (src/config/dabest.ts).
    const signs = (SIGNS[name] ?? []).filter((sign) => isShownSign(name, sign.label));
    await seedCategoryGestures(name, signs);
  }

  console.log(
    "FSL gestures seeded successfully.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Error seeding FSL gestures:",
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
