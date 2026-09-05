import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({adapter});

async function main() {
  const basicFsl = await prisma.learningArea.findFirst({
    where: {
      name: "Basic Filipino Sign Language",
    },
  });

  const communication = await prisma.learningArea.findFirst({
    where: {
      name: "Communication",
    },
  });

  if (!basicFsl || !communication) {
    throw new Error("Learning areas not found. Run the learning areas seeder first.");
  }

  await prisma.category.createMany({
    data: [
      {
        learningAreaId: basicFsl.id,
        name: "Alphabet",
        description: "Learn the Filipino Sign Language alphabet.",
        displayOrder: 1,
        isActive: true,
      },
      {
        learningAreaId: basicFsl.id,
        name: "Numbers",
        description: "Learn Filipino Sign Language numbers.",
        displayOrder: 2,
        isActive: true,
      },
      {
        learningAreaId: basicFsl.id,
        name: "Shapes",
        description: "Learn signs for basic shapes.",
        displayOrder: 3,
        isActive: true,
      },
      {
        learningAreaId: basicFsl.id,
        name: "Colors",
        description: "Learn Filipino Sign Language signs for basic colors.",
        displayOrder: 4,
        isActive: true,
      },
      {
        learningAreaId: basicFsl.id,
        name: "Greetings",
        description: "Learn common Filipino Sign Language greetings.",
        displayOrder: 5,
        isActive: true,
      },
      {
        learningAreaId: basicFsl.id,
        name: "Calendar",
        description: "Learn Filipino Sign Language concepts related to the calendar.",
        displayOrder: 6,
        isActive: true,
      },
      {
        learningAreaId: communication.id,
        name: "WH Questions",
        description: "Learn Filipino Sign Language for common WH questions.",
        displayOrder: 1,
        isActive: true,
      },
      {
        learningAreaId: communication.id,
        name: "Word Concepts",
        description: "Learn Filipino Sign Language word concepts and their usage.",
        displayOrder: 2,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

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


