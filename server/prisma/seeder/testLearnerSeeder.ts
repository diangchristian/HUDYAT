import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Test1234!", 10);

  const user = await prisma.user.upsert({
    where: {
      email: "testlearner@hudyat.local",
    },
    update: {
      username: "testlearner",
      password: hashedPassword,
      role: "LEARNER",
      isActive: true,
    },
    create: {
      username: "testlearner",
      email: "testlearner@hudyat.local",
      password: hashedPassword,
      role: "LEARNER",
      isActive: true,
      learnerProfile: {
        create: {
          fullName: "Test Learner",
        },
      },
    },
    include: {
      learnerProfile: true,
    },
  });

  console.log("✓ Test learner seeded successfully.");
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Learner ID: ${user.learnerProfile?.userId}`);
}

main()
  .catch((error) => {
    console.error("✗ Error seeding test learner:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });