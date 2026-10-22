import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { DABEST_CATEGORIES, isDabestCategory } from "../../src/config/dabest.js";

/*
 * The DABEST seeders rewrite categories and assessments for DABEST's own
 * database. Run against the full HUDYAT database (it has other categories)
 * they would overwrite real data, so they refuse to run there.
 */
export async function assertDabestDatabase(prisma: PrismaClient) {
  const categories = await prisma.category.findMany({ select: { name: true } });
  const others = categories.map((c) => c.name).filter((name) => !isDabestCategory(name));

  if (others.length > 0) {
    throw new Error(
      `This database has categories DABEST does not use (${others.join(", ")}), so it is not ` +
        `the DABEST database. Nothing was changed. Point DATABASE_URL in server/.env at the ` +
        `DABEST database (only ${DABEST_CATEGORIES.join(", ")}) and run the seeders again.`,
    );
  }
}
