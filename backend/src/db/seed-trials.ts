import prisma from "./client.js";

async function seedTrials() {
  const sources = await prisma.source.findMany({ take: 10 });

  if (sources.length === 0) {
    console.error("No sources found. Run seed.ts first.");
    process.exit(1);
  }

  const sourceMap: Record<string, number> = {};
  for (const s of sources) {
    sourceMap[s.shortName] = s.id;
  }

  const sampleTrials = [
    {
      title: "Canine Osteosarcoma Immunotherapy with Listeria-Based Vaccine",
      sourceId: sources[0].id,
      sourceUrl: "https://www.vet.upenn.edu/ryan-hospital/clinical-trials/osteosarcoma-immunotherapy",
      species: ["dog"],
      conditionCategory: "oncology",
      conditionSpecific: "Osteosarcoma",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs diagnosed with appendicular osteosarcoma, weight >15kg, no prior chemotherapy",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Compensation provided for travel and study-related costs",
      locationCity: "Philadelphia",
      locationState: "PA",
    },
    {
      title: "Feline Hyperthyroidism: Comparison of Radioiodine Dosing Protocols",
      sourceId: sources[1].id,
      sourceUrl: "https://www.vet.cornell.edu/hospitals/clinical-trials/feline-hyperthyroidism",
      species: ["cat"],
      conditionCategory: "endocrine",
      conditionSpecific: "Hyperthyroidism",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Cats 8+ years old with confirmed hyperthyroidism, no renal disease",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Study covers all treatment costs",
      locationCity: "Ithaca",
      locationState: "NY",
    },
    {
      title: "Canine Lymphoma: Novel CAR-T Cell Therapy Phase I",
      sourceId: sources[2].id,
      sourceUrl: "https://vetmedbiosci.colostate.edu/vth/clinical-trials/canine-lymphoma-cart",
      species: ["dog"],
      conditionCategory: "oncology",
      conditionSpecific: "Lymphoma",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs with B-cell lymphoma, naive to treatment, age 2-12 years",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "All study-related treatments provided at no cost",
      locationCity: "Fort Collins",
      locationState: "CO",
    },
    {
      title: "Canine Degenerative Myelopathy: Stem Cell Treatment Trial",
      sourceId: sources[3].id,
      sourceUrl: "https://vmc.vet.osu.edu/clinical-trials-office/current-trials/degenerative-myelopathy",
      species: ["dog"],
      conditionCategory: "neurology",
      conditionSpecific: "Degenerative Myelopathy",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs with confirmed DM, age 8+, German Shepherd preferred but all breeds accepted",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Reduced cost diagnostics; stem cell treatment provided free",
      locationCity: "Columbus",
      locationState: "OH",
    },
    {
      title: "Equine Metabolic Syndrome: Dietary Intervention Study",
      sourceId: sources[4].id,
      sourceUrl: "https://clinicaltrials.vetmed.ucdavis.edu/equine-metabolic",
      species: ["horse"],
      conditionCategory: "endocrine",
      conditionSpecific: "Equine Metabolic Syndrome",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Horses aged 5-18 with EMS diagnosis, able to be transported to Davis",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "All diagnostics and dietary supplements provided",
      locationCity: "Davis",
      locationState: "CA",
    },
    {
      title: "Canine Atopic Dermatitis: Novel Biologic Therapy Trial",
      sourceId: sources[5].id,
      sourceUrl: "https://cvm.ncsu.edu/research/clinical-trials/atopic-dermatitis",
      species: ["dog"],
      conditionCategory: "dermatology",
      conditionSpecific: "Atopic Dermatitis",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs 1-10 years with confirmed atopy, not currently on Cytopoint or Apoquel",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Medication provided at no cost; $50 visit reimbursement",
      locationCity: "Raleigh",
      locationState: "NC",
    },
    {
      title: "Feline Chronic Kidney Disease: Erythropoietin Supplementation",
      sourceId: sources[6].id,
      sourceUrl: "https://vet.tufts.edu/clinical-trials/feline-ckd",
      species: ["cat"],
      conditionCategory: "nephrology",
      conditionSpecific: "Chronic Kidney Disease",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Cats with Stage 2-3 CKD, PCV <25%, age 5+ years",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Treatment and monitoring provided free",
      locationCity: "North Grafton",
      locationState: "MA",
    },
    {
      title: "Canine Epilepsy: Vagal Nerve Stimulation Device Study",
      sourceId: sources[7].id,
      sourceUrl: "https://research.vetmed.ufl.edu/clinical-trials/canine-epilepsy-vns",
      species: ["dog"],
      conditionCategory: "neurology",
      conditionSpecific: "Idiopathic Epilepsy",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs with refractory epilepsy on 2+ medications, seizures despite treatment",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Device implantation at no cost; follow-up visits covered",
      locationCity: "Gainesville",
      locationState: "FL",
    },
    {
      title: "Canine Hip Dysplasia: Platelet-Rich Plasma vs. Standard of Care",
      sourceId: sources[8].id,
      sourceUrl: "https://vet.purdue.edu/ctr/clinical-research/veterinary-clinical-trials.php?id=hip-dysplasia",
      species: ["dog"],
      conditionCategory: "orthopedic",
      conditionSpecific: "Hip Dysplasia",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Large breed dogs 1-4 years with radiographically confirmed HD",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "PRP treatment provided free; radiographs at reduced cost",
      locationCity: "West Lafayette",
      locationState: "IN",
    },
    {
      title: "Canine Mast Cell Tumor: Toceranib Combination Therapy",
      sourceId: sources[9].id,
      sourceUrl: "https://cvm.msu.edu/hospital/veterinarians/clinical-trials/mast-cell",
      species: ["dog"],
      conditionCategory: "oncology",
      conditionSpecific: "Mast Cell Tumor",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs with Grade 2-3 mast cell tumors, no prior targeted therapy",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Medication provided; imaging at reduced cost",
      locationCity: "East Lansing",
      locationState: "MI",
    },
    {
      title: "Feline Asthma: Inhaled Ciclesonide vs. Fluticasone",
      sourceId: sources[0].id,
      sourceUrl: "https://www.vet.upenn.edu/ryan-hospital/clinical-trials/feline-asthma",
      species: ["cat"],
      conditionCategory: "pulmonary",
      conditionSpecific: "Feline Asthma",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Cats with confirmed bronchial asthma, not currently on corticosteroids",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "All medication and monitoring provided at no cost",
      locationCity: "Philadelphia",
      locationState: "PA",
    },
    {
      title: "Canine Cognitive Dysfunction: Omega-3 Supplementation RCT",
      sourceId: sources[1].id,
      sourceUrl: "https://www.vet.cornell.edu/hospitals/clinical-trials/canine-cds",
      species: ["dog"],
      conditionCategory: "neurology",
      conditionSpecific: "Cognitive Dysfunction Syndrome",
      enrollmentStatus: "enrolling",
      eligibilitySummary: "Dogs 9+ years showing signs of CDS, no current omega-3 supplementation",
      principalInvestigator: "Dr. Example Investigator",
      contactEmail: "demo-contact@example.com",
      financialInfo: "Supplements provided; 3-month follow-up included",
      locationCity: "Ithaca",
      locationState: "NY",
    },
  ];

  console.log("Seeding sample trials...");
  let count = 0;
  for (const trial of sampleTrials) {
    await prisma.trial.upsert({
      where: {
        sourceId_title: {
          sourceId: trial.sourceId,
          title: trial.title,
        },
      },
      update: trial,
      create: trial,
    });
    count++;
  }

  console.log(`Seeded ${count} sample trials.`);
  await prisma.$disconnect();
}

seedTrials().catch((e) => {
  console.error(e);
  process.exit(1);
});
