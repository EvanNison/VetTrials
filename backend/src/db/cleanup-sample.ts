import prisma from "./client.js";

async function main() {
  const deleted = await prisma.trial.deleteMany({
    where: {
      contentHash: null,
      enrollmentStatus: "enrolling",
    },
  });
  console.log("Deleted fake sample trials:", deleted.count);

  const count = await prisma.trial.count({ where: { isActive: true } });
  console.log("Active real trials remaining:", count);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
