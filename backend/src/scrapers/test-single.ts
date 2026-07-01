import "dotenv/config";
import prisma from "../db/client.js";
import { scrapeSource, closeBrowser } from "./scrape.js";

const sourceName = process.argv[2] || "Colorado State University";

async function main() {
  const source = await prisma.source.findFirst({
    where: { name: { contains: sourceName } },
  });

  if (!source) {
    console.error(`Source not found: ${sourceName}`);
    process.exit(1);
  }

  console.log(`Testing scrape for: ${source.name} (${source.url})`);
  await scrapeSource(source);

  const trials = await prisma.trial.findMany({
    where: { sourceId: source.id, isActive: true },
  });

  console.log(`\nTrials in database for ${source.name}: ${trials.length}`);
  for (const trial of trials) {
    console.log(`  - [${trial.enrollmentStatus}] ${trial.title}`);
    console.log(`    Species: ${trial.species.join(", ")} | Category: ${trial.conditionCategory}`);
    if (trial.principalInvestigator) console.log(`    PI: ${trial.principalInvestigator}`);
    console.log("");
  }

  await closeBrowser();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
