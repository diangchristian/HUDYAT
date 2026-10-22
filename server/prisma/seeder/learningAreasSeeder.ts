import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import { DABEST_LEARNING_AREA } from "../../src/config/dabest.js";
import { assertDabestDatabase } from "./dabestGuard.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });



async function main() {
  await assertDabestDatabase(prisma);

  // DABEST: one learning area, holding its four categories (src/config/dabest.ts).
  // Found by name, so running the seeder again does not add a second one.
  const existing = await prisma.learningArea.findFirst({
    where: { name: DABEST_LEARNING_AREA.name },
  });

  if (!existing) {
    await prisma.learningArea.create({
      data: { ...DABEST_LEARNING_AREA, displayOrder: 1, isActive: true },
    });
  }

  console.log("Learning areas seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

