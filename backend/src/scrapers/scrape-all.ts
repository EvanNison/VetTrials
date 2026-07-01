import "dotenv/config";
import { scrapeAllSources } from "./scrape.js";
import prisma from "../db/client.js";

async function main() {
  console.log("Starting full scrape of all sources...");
  await scrapeAllSources();

  const stats = await prisma.trial.count({ where: { isActive: true } });
  console.log(`\nTotal active trials in database: ${stats}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
