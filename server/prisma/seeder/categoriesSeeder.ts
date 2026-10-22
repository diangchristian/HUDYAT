import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import { DABEST_CATEGORIES, DABEST_LEARNING_AREA } from "../../src/config/dabest.js";

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
 * DABEST: creates its four categories (src/config/dabest.ts), in the order
 * the learner works through them. Their signs are added by
 * `npm run seed:fsl-gestures`, which needs these categories to exist.
 */
async function main() {
  const area = await prisma.learningArea.findFirst({
    where: {
      name: DABEST_LEARNING_AREA.name,
    },
  });

  if (!area) {
    throw new Error(
      "Learning area not found. Run the learning areas seeder first.",
    );
  }

  for (const [index, name] of DABEST_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: {
        learningAreaId_name: {
          learningAreaId: area.id,
          name,
        },
      },
      update: {
        displayOrder: index + 1,
        isActive: true,
      },
      create: {
        learningAreaId: area.id,
        name,
        displayOrder: index + 1,
        isActive: true,
      },
    });

    console.log(`✓ Category: ${name}`);
  }

  console.log("Categories seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
