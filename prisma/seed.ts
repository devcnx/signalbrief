import "dotenv/config";
import { starterSources } from "../config/starter-sources";
import { createPrismaClient } from "../src/lib/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("Seeding database...");

  for (const source of starterSources) {
    const result = await prisma.source.upsert({
      where: { url: source.url },
      update: {
        provider: source.provider,
        name: source.name,
        type: source.type,
        category: source.category,
        priority: source.priority,
        active: source.active,
        notes: source.notes,
      },
      create: {
        provider: source.provider,
        name: source.name,
        url: source.url,
        type: source.type,
        category: source.category,
        priority: source.priority,
        active: source.active,
        notes: source.notes,
      },
    });
    console.log(`  Upserted: ${result.name}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
