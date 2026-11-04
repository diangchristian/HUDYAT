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

const ADMIN_EMAIL = "testadmin@hudyat.local";

// shortcut: uses the shared dev password, a production admin needs its own seed with a private password.
async function main() {
  const hashedPassword = await bcrypt.hash("Test1234!", 10);

  const user = await prisma.user.upsert({
    where: {
      email: ADMIN_EMAIL,
    },
    update: {
      username: "testadmin",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      username: "testadmin",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✓ Test admin seeded successfully.");
  console.log(`Username: ${user.username}`);
  console.log(`Email: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("✗ Error seeding test admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
