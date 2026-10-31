import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

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

/*
 * Creates the categories under their learning areas (run the learning
 * areas seeder first). Their signs are added by `npm run seed:fsl-gestures`,
 * which needs these categories to exist.
 *
 * displayOrder is unique within a learning area and is the teaching order
 * (it decides which category unlocks next). Existing databases get the same
 * values from the reorder_categories migration, so re-running only adds what
 * is missing.
 */
const CATEGORIES = [
  { area: "Basic Filipino Sign Language", name: "Alphabet", displayOrder: 1 },
  { area: "Basic Filipino Sign Language", name: "Numbers", displayOrder: 2 },
  { area: "Basic Filipino Sign Language", name: "Greetings", displayOrder: 3 },
  { area: "Basic Filipino Sign Language", name: "Family", displayOrder: 4 },
  { area: "Basic Filipino Sign Language", name: "Colors", displayOrder: 5 },
  { area: "Basic Filipino Sign Language", name: "Shapes", displayOrder: 6 },
  { area: "Basic Filipino Sign Language", name: "Calendar", displayOrder: 7 },
  { area: "Communication", name: "WH Questions", displayOrder: 7 },
  { area: "Communication", name: "Word Concepts", displayOrder: 8 },
];

async function main() {
  for (const category of CATEGORIES) {
    const area = await prisma.learningArea.findFirst({
      where: {
        name: category.area,
      },
    });

    if (!area) {
      throw new Error(
        `Learning area "${category.area}" not found. Run the learning areas seeder first.`,
      );
    }

    await prisma.category.upsert({
      where: {
        learningAreaId_name: {
          learningAreaId: area.id,
          name: category.name,
        },
      },
      update: {},
      create: {
        learningAreaId: area.id,
        name: category.name,
        displayOrder: category.displayOrder,
        isActive: true,
      },
    });

    console.log(`✓ Category: ${category.name}`);
  }

  console.log("Categories seeded successfully.");
}

main()
  .catch((error) => {
    console.error(
      "Error seeding categories:",
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
