# SOURCES.md — Complete Scraping Target Directory

## Usage

This file is the canonical source of truth for all institutions to scrape. The seed script reads this file to populate the `sources` table.

Each entry includes the information needed for the database seed:

```
name | short_name | url | tier | scrape_method | notes
```

---

## Tier 1: Major U.S. Academic Veterinary Schools

These are the primary scraping targets. All have dedicated clinical trials pages.

| # | Name | Short | URL | Method | Notes |
|---|------|-------|-----|--------|-------|
| 1 | University of Pennsylvania | Penn Vet | https://www.vet.upenn.edu/ryan-hospital/clinical-trials/ | playwright | VCIC office; large case load |
| 2 | Cornell University | Cornell | https://www.vet.cornell.edu/hospitals/clinical-trials | playwright | Clinical Trials Program since 2015 |
| 3 | Colorado State University | CSU | https://vetmedbiosci.colostate.edu/vth/clinical-trials/ | playwright | Flint Animal Cancer Center; excellent structured data |
| 4 | Ohio State University | Ohio State | https://vmc.vet.osu.edu/clinical-trials-office/current-trials | playwright | Blue Buffalo CTO; 30-50 trials/year; also publishes PDF list |
| 5 | UC Davis | UC Davis | https://clinicaltrials.vetmed.ucdavis.edu/ | playwright | Uses StudyPages; 30-50 studies at a time |
| 6 | NC State University | NC State | https://cvm.ncsu.edu/research/clinical-trials/ | playwright | Clinical Studies Core; may need sub-page scraping by service |
| 7 | Tufts University | Tufts | https://vet.tufts.edu/clinical-trials | playwright | Cummings School; Foster Hospital |
| 8 | University of Florida | UF | https://research.vetmed.ufl.edu/clinical-trials/ | playwright | Dedicated clinical studies team |
| 9 | Purdue University | Purdue | https://vet.purdue.edu/ctr/clinical-research/veterinary-clinical-trials.php | playwright | Clinical Trials Support Service; filterable by species |
| 10 | Michigan State University | MSU | https://cvm.msu.edu/hospital/veterinarians/clinical-trials | playwright | Oncology, neurology, imaging trials |
| 11 | University of Wisconsin-Madison | Wisconsin | https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/ | playwright | Strong oncology; sub-pages by specialty |
| 12 | Texas A&M University | TAMU | https://vetmed.tamu.edu/clinical-trials/ | playwright | OVCI office; also uses StudyPages |
| 13 | University of Minnesota | Minnesota | https://vetmed.umn.edu/departments/centers-and-programs/clinical-investigation-center/current-clinical-trials | playwright | CIC; FDA Phase I-IV experience |
| 14 | University of Georgia | UGA | https://vet.uga.edu/research/clinical-trials/ | playwright | Searchable trials interface |
| 15 | University of Missouri | Mizzou | https://vhc.missouri.edu/small-animal-hospital/oncology/clinical-trials/current-clinical-trials/ | playwright | Oncology sub-page; active in multi-site trials |
| 16 | University of Illinois | Illinois | https://vetmed.illinois.edu/research/clinical-trials/ | playwright | Active oncology trials |
| 17 | University of Tennessee | Tennessee | https://vetmed.tennessee.edu/research/clinical-trials/ | playwright | Only academic vet center in TN |
| 18 | Auburn University | Auburn | https://www.vetmed.auburn.edu/research/clinical-trials/ | playwright | Oncology Service-led trials |
| 19 | Iowa State University | Iowa State | https://vetmed.iastate.edu/vmc/clinical-trials/ | playwright | Lloyd Veterinary Medical Center |
| 20 | Kansas State University | Kansas State | https://www.ksvhc.org/services/clinical-trials/ | playwright | Email: ClinicalTrials@vet.k-state.edu |
| 21 | Louisiana State University | LSU | https://www.lsu.edu/vetmed/veterinary_hospital/clinical_trials.php | playwright | Center for Clinical Innovation |
| 22 | Oregon State University | Oregon State | https://vetmed.oregonstate.edu/hospital/oncology/clinical-trials | playwright | Carlson College; oncology-focused |
| 23 | Washington State University | WSU | https://vcs.vetmed.wsu.edu/research/clinical-studies | playwright | URL may need verification; IBD focus |
| 24 | Virginia-Maryland College | VA-MD | https://research.vetmed.vt.edu/clinical-trials.html | playwright | Virginia Tech campus; Clinical Research Office |
| 25 | Oklahoma State University | Oklahoma State | https://vetmed.okstate.edu/ | playwright | Listed by Vet Cancer Society; trials may be within department pages — scrape main page and look for trials section |

---

## Tier 2: Additional Academic & Research Institutions

| # | Name | Short | URL | Method | Notes |
|---|------|-------|-----|--------|-------|
| 26 | Johns Hopkins University (CIGAT) | JHU | https://www.hopkinsmedicine.org/radiology/veterinarians/clinical-trials | playwright | Center for Image-Guided Animal Therapy; osteosarcoma/glioma focus |
| 27 | University of Arizona | Arizona | https://vfce.arizona.edu/valley-fever-dogs/clinical-trials-dogs | playwright | Valley Fever Center for Excellence; niche but active |

---

## Tier 3: Canadian Institutions

| # | Name | Short | URL | Method | Notes |
|---|------|-------|-----|--------|-------|
| 28 | Ontario Veterinary College (Univ. of Guelph) | OVC | https://ovc.uoguelph.ca/clinicaltrials/ | playwright | Leading Canadian vet school; well-organized |

---

## Tier 4: Major Private Specialty Hospitals

These institutions run their own clinical trials or participate as sites in multi-center trials.

| # | Name | Short | URL | Method | Notes |
|---|------|-------|-----|--------|-------|
| 29 | Animal Medical Center (NYC) | AMC | https://www.amcny.org/current-clinical-trials/ | playwright | Schwarzman AMC; 20+ specialties; 50+ years of trials |
| 30 | Cornell University Veterinary Specialists | CUVS | https://www.cuvs.org/clinical_trials | playwright | Stamford, CT satellite; may overlap with Cornell main |

---

## Tier 5: Centralized Registries (Cross-Reference Only)

These are NOT scraped for primary trial data. They are used to cross-reference and enrich our data.

| # | Name | Short | URL | Method | Notes |
|---|------|-------|-----|--------|-------|
| 31 | AVMA Veterinary Clinical Trials Registry | AVMA | https://veterinaryclinicaltrials.org/studies/ | playwright | Cross-reference for AVMA IDs; opt-in registry |

---

## StudyPages Sources (Alternative URLs)

Some schools use StudyPages as their trial management platform. These URLs may provide cleaner, more structured data:

| School | StudyPages URL |
|--------|---------------|
| UC Davis | https://studypages.com/ucdavisvet/ |
| Texas A&M | https://studypages.com/tamuvetmed/home/ |

---

## Wisconsin Sub-Pages

University of Wisconsin organizes trials by specialty. May need to scrape multiple pages:

| Specialty | URL |
|-----------|-----|
| Oncology | https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/oncology/ |
| All Studies | https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/ |

---

## NC State Sub-Pages

NC State organizes by species and service area. Main page should capture all, but sub-pages exist:

| Filter | URL |
|--------|-----|
| All Trials | https://cvm.ncsu.edu/research/clinical-trials/ |

---

## Seed Script Data Format

The seed script should read this file and insert/update the `sources` table. Example format:

```typescript
const sources = [
  {
    name: "University of Pennsylvania",
    short_name: "Penn Vet",
    url: "https://www.vet.upenn.edu/ryan-hospital/clinical-trials/",
    tier: 1,
    scrape_method: "playwright",
    is_active: true,
  },
  // ... etc for all sources above
];
```

---

## Maintenance Notes

- **Verify URLs quarterly.** University websites change. Run a health check script that hits each URL and flags any 404s or redirects.
- **Watch for new vet schools.** The AVMA accredits new schools periodically. Check https://www.avma.org/education/center-for-veterinary-accreditation/accredited-veterinary-colleges annually.
- **Private referral centers are expanding.** BluePearl, VCA, Ethos Veterinary Health all have growing research programs. Monitor for new trial pages.
- **International expansion.** Royal Veterinary College (UK), University of Sydney, University of Zurich, and others have trial programs. Add when/if we go international.
