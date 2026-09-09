import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

import alphabet from "../data/learning/alphabet.json";
import numbers from "../data/learning/numbers.json";
import days from "../data/learning/days.json";
import calendar from "../data/learning/calendar.json";
import greetings from "../data/learning/greetings.json";
import shapes from "../data/learning/shapes.json";
import colors from "../data/learning/colors.json";
import whQuestions from "../data/learning/wh-questions.json";
import wordConcepts from "../data/learning/word-concepts.json";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

type GestureData = {
  label: string;
  meaning: string;
  exampleUsage: string;
  displayOrder: number;
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
    const fslGesture = await prisma.fslGesture.upsert({
      where: {
        label: gesture.label,
      },
      update: {
        meaning: gesture.meaning,
      },
      create: {
        label: gesture.label,
        meaning: gesture.meaning,
        modelClass: gesture.label,
        isValidated: false,
      },
    });

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

async function main() {
  await seedCategoryGestures(
    "Alphabet",
    alphabet,
  );

  await seedCategoryGestures(
    "Numbers",
    numbers,
  );

  await seedCategoryGestures(
    "Greetings",
    greetings,
  );

  /*
   * Calendar combines:
   *
   * 1–12  = January–December
   * 13–19 = Monday–Sunday
   * 20    = Today
   * 21    = Yesterday
   * 22    = Tomorrow
   */
  const mergedCalendarGestures: GestureData[] = [
    ...calendar,

    ...days.map((gesture, index) => ({
      ...gesture,
      displayOrder:
        calendar.length + index + 1,
    })),
  ];

  await seedCategoryGestures(
    "Calendar",
    mergedCalendarGestures,
  );

  console.log(
    `✓ Calendar: ${mergedCalendarGestures.length} gestures seeded`,
  );

  await seedCategoryGestures(
    "Shapes",
    shapes,
  );

  await seedCategoryGestures(
    "Colors",
    colors,
  );

  await seedCategoryGestures(
    "WH Questions",
    whQuestions,
  );

  await seedCategoryGestures(
    "Word Concepts",
    wordConcepts,
  );

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
