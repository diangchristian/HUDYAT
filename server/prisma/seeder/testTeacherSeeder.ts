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

const TEACHER_EMAIL = "testteacher@hudyat.local";

async function main() {
  const hashedPassword = await bcrypt.hash("Test1234!", 10);

  const user = await prisma.user.upsert({
    where: {
      email: TEACHER_EMAIL,
    },
    update: {
      username: "testteacher",
      password: hashedPassword,
      role: "TEACHER",
      isActive: true,
    },
    create: {
      username: "testteacher",
      email: TEACHER_EMAIL,
      password: hashedPassword,
      role: "TEACHER",
      isActive: true,
    },
  });

  // Upserted separately so re-running also repairs a teacher user
  // that exists without a profile.
  const profile = await prisma.teacherProfile.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
      fullName: "Test Teacher",
      email: TEACHER_EMAIL,
    },
  });

  console.log("✓ Test teacher seeded successfully.");
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Teacher ID: ${profile.userId}`);
}

main()
  .catch((error) => {
    console.error("✗ Error seeding test teacher:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
