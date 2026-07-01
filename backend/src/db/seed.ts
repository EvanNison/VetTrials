import prisma from "./client.js";

const sources = [
  { name: "University of Pennsylvania", shortName: "Penn Vet", url: "https://www.vet.upenn.edu/ryan-hospital/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Cornell University", shortName: "Cornell", url: "https://www.vet.cornell.edu/hospitals/clinical-trials", tier: 1, scrapeMethod: "playwright" },
  { name: "Colorado State University", shortName: "CSU", url: "https://csuveterinaryhealth.org/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Ohio State University", shortName: "Ohio State", url: "https://vmc.vet.osu.edu/clinical-trials-office/current-trials", tier: 1, scrapeMethod: "playwright" },
  { name: "UC Davis", shortName: "UC Davis", url: "https://clinicaltrials.vetmed.ucdavis.edu/", tier: 1, scrapeMethod: "playwright" },
  { name: "NC State University", shortName: "NC State", url: "https://cvm.ncsu.edu/research/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Tufts University", shortName: "Tufts", url: "https://vet.tufts.edu/clinical-trials", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Florida", shortName: "UF", url: "https://research.vetmed.ufl.edu/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Purdue University", shortName: "Purdue", url: "https://vet.purdue.edu/ctr/clinical-research/veterinary-clinical-trials.php", tier: 1, scrapeMethod: "playwright" },
  { name: "Michigan State University", shortName: "MSU", url: "https://cvm.msu.edu/hospital/veterinarians/clinical-trials", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Wisconsin-Madison", shortName: "Wisconsin", url: "https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/", tier: 1, scrapeMethod: "playwright" },
  { name: "Texas A&M University", shortName: "TAMU", url: "https://vetmed.tamu.edu/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Minnesota", shortName: "Minnesota", url: "https://vetmed.umn.edu/departments/centers-and-programs/clinical-investigation-center/current-clinical-trials", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Georgia", shortName: "UGA", url: "https://vet.uga.edu/research/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Missouri", shortName: "Mizzou", url: "https://vhc.missouri.edu/small-animal-hospital/oncology/clinical-trials/current-clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Illinois", shortName: "Illinois", url: "https://vetmed.illinois.edu/research/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "University of Tennessee", shortName: "Tennessee", url: "https://vetmed.tennessee.edu/research/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Auburn University", shortName: "Auburn", url: "https://www.vetmed.auburn.edu/research/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Iowa State University", shortName: "Iowa State", url: "https://vetmed.iastate.edu/vmc/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Kansas State University", shortName: "Kansas State", url: "https://www.ksvhc.org/services/clinical-trials/", tier: 1, scrapeMethod: "playwright" },
  { name: "Louisiana State University", shortName: "LSU", url: "https://www.lsu.edu/vetmed/veterinary_hospital/clinical_trials.php", tier: 1, scrapeMethod: "playwright" },
  { name: "Oregon State University", shortName: "Oregon State", url: "https://vetmed.oregonstate.edu/hospital/oncology/clinical-trials", tier: 1, scrapeMethod: "playwright" },
  { name: "Washington State University", shortName: "WSU", url: "https://vcs.vetmed.wsu.edu/research/clinical-studies", tier: 1, scrapeMethod: "playwright" },
  { name: "Virginia-Maryland College", shortName: "VA-MD", url: "https://research.vetmed.vt.edu/clinical-trials.html", tier: 1, scrapeMethod: "playwright" },
  { name: "Oklahoma State University", shortName: "Oklahoma State", url: "https://vetmed.okstate.edu/", tier: 1, scrapeMethod: "playwright" },
  { name: "Johns Hopkins University (CIGAT)", shortName: "JHU", url: "https://www.hopkinsmedicine.org/radiology/veterinarians/clinical-trials", tier: 2, scrapeMethod: "playwright" },
  { name: "University of Arizona", shortName: "Arizona", url: "https://vfce.arizona.edu/valley-fever-dogs/clinical-trials-dogs", tier: 2, scrapeMethod: "playwright" },
  { name: "Ontario Veterinary College (Univ. of Guelph)", shortName: "OVC", url: "https://ovc.uoguelph.ca/clinicaltrials/", tier: 3, scrapeMethod: "playwright" },
  { name: "Animal Medical Center (NYC)", shortName: "AMC", url: "https://www.amcny.org/current-clinical-trials/", tier: 4, scrapeMethod: "playwright" },
  { name: "Cornell University Veterinary Specialists", shortName: "CUVS", url: "https://www.cuvs.org/clinical_trials", tier: 4, scrapeMethod: "playwright" },
  { name: "AVMA Veterinary Clinical Trials Registry", shortName: "AVMA", url: "https://veterinaryclinicaltrials.org/studies/", tier: 5, scrapeMethod: "playwright" },
];

async function seed() {
  console.log("Seeding sources...");

  for (const source of sources) {
    const existing = await prisma.source.findFirst({
      where: { shortName: source.shortName },
    });

    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: {
          name: source.name,
          shortName: source.shortName,
          url: source.url,
          tier: source.tier,
          scrapeMethod: source.scrapeMethod,
        },
      });
      continue;
    }

    await prisma.source.upsert({
      where: { url: source.url },
      update: {
        name: source.name,
        shortName: source.shortName,
        tier: source.tier,
        scrapeMethod: source.scrapeMethod,
      },
      create: source,
    });
  }

  const count = await prisma.source.count();
  console.log(`Seeded ${count} sources.`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
