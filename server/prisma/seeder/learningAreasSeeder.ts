import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });



async function main() {
  await prisma.learningArea.createMany({
    data: [
      {
        name: "Basic Filipino Sign Language",
        description:
          "Learn the fundamental Filipino Sign Language signs, including the alphabet, numbers, shapes, colors, greetings, and calendar concepts.",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "Communication",
        description:
          "Learn Filipino Sign Language concepts used for everyday communication, including WH questions and word concepts.",
        displayOrder: 2,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

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

