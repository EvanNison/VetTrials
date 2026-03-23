# VetTrials: Veterinary Clinical Trials Aggregator
## Product Specification & Research Brief

**Prepared by:** NisonCo AI Consulting
**Date:** March 23, 2026
**Status:** Research Complete / Ready for Build

---

## The Problem

Veterinary clinicians — especially oncologists — must manually visit 30+ individual university websites to track active clinical trials across the U.S. and Canada. There is no single, comprehensive, real-time aggregator that pulls directly from each institution's own trial listings. The oncologist's exact quote: he has to search Penn, then Cornell, then Colorado State, one by one, to keep track of what studies are recruiting.

## Existing Landscape & Why There's Still a Gap

### AVMA Veterinary Clinical Trials Registry
- **URL:** https://veterinaryclinicaltrials.org
- **What it is:** The AVMA relaunched this in February 2024 (formerly the Animal Health Studies Database, originally launched 2016). It's the closest thing to what we're describing.
- **The catch:** It's opt-in and self-reported. Researchers must manually submit their studies. A Frontiers in Veterinary Science paper noted that the original database had "limited utility" due to resource constraints. The registry only contains studies that investigators choose to list — it does NOT automatically scrape or sync with what's actually posted on each school's website.
- **Opportunity:** Many active trials on university websites are NOT listed in the AVMA registry. A tool that scrapes directly from the source and cross-references the AVMA registry would be strictly more complete.

### Veterinary Cancer Society Links Page
- **URL:** https://vetcancersociety.org/resources/clinical-trials/
- **What it is:** A static list of links to each school's trials page. Oncology-focused only.
- **The catch:** It's literally just a link directory. No aggregation, no search, no filtering.

### The Pet Fund / Perseus Foundation / Canine Cancer Alliance
- Similar link directories. No aggregation.

**Bottom line:** Nobody is doing automated, direct-from-source aggregation with AI normalization. The AVMA registry is the best attempt but relies on voluntary submission and has known coverage gaps.

---

## Complete Source Directory: Veterinary Schools & Institutions with Clinical Trials

### Tier 1: Major Academic Veterinary Schools (U.S.)

| # | Institution | Clinical Trials URL | Notes |
|---|------------|---------------------|-------|
| 1 | University of Pennsylvania (Penn Vet) | https://www.vet.upenn.edu/ryan-hospital/clinical-trials/ | VCIC office; 14+ years managing trials; 34K+ pets/year |
| 2 | Cornell University | https://www.vet.cornell.edu/hospitals/clinical-trials | Clinical Trials Program since 2015; Riney Canine Health Center funding |
| 3 | Colorado State University (Flint Animal Cancer Center) | https://vetmedbiosci.colostate.edu/vth/clinical-trials/ | One of the largest vet oncology programs in the world |
| 4 | The Ohio State University | https://vmc.vet.osu.edu/clinical-trials-office/current-trials | Blue Buffalo Veterinary Clinical Trials Office; 30-50 trials/year |
| 5 | UC Davis | https://clinicaltrials.vetmed.ucdavis.edu/ | Veterinary Center for Clinical Trials (VCCT); 30-50 studies at any time; uses StudyPages |
| 6 | North Carolina State University | https://cvm.ncsu.edu/research/clinical-trials/ | Clinical Studies Core (CSC); filterable by species and service |
| 7 | Tufts University (Cummings School) | https://vet.tufts.edu/clinical-trials | Foster Hospital for Small Animals |
| 8 | University of Florida | https://research.vetmed.ufl.edu/clinical-trials/ | Dedicated clinical studies team; strong oncology program |
| 9 | Purdue University | https://vet.purdue.edu/ctr/clinical-research/veterinary-clinical-trials.php | Veterinary Clinical Trials Support Service; filterable by species |
| 10 | Michigan State University | https://cvm.msu.edu/hospital/veterinarians/clinical-trials | Active oncology, neurology, and imaging trials |
| 11 | University of Wisconsin-Madison | https://uwveterinarycare.wisc.edu/veterinary-clinical-studies/ | Strong oncology program; dedicated trial email |
| 12 | Texas A&M University | https://vetmed.tamu.edu/clinical-trials/ | Office of Veterinary Clinical Investigation (OVCI); also uses StudyPages |
| 13 | University of Minnesota | https://vetmed.umn.edu/departments/centers-and-programs/clinical-investigation-center/current-clinical-trials | Clinical Investigation Center (CIC); 15+ years experience; FDA Phase I-IV |
| 14 | University of Georgia | https://vet.uga.edu/research/clinical-trials/ | Search-enabled clinical trials page |
| 15 | University of Missouri | https://vhc.missouri.edu/small-animal-hospital/oncology/clinical-trials/current-clinical-trials/ | Veterinary Health Center; active in multi-site CAR-T trials |
| 16 | University of Illinois | https://vetmed.illinois.edu/research/clinical-trials/ | Active oncology and other specialty trials |
| 17 | University of Tennessee | https://vetmed.tennessee.edu/research/clinical-trials/ | Only academic vet center in Tennessee |
| 18 | Auburn University | https://www.vetmed.auburn.edu/research/clinical-trials/ | Oncology Service leads most trials |
| 19 | Iowa State University | https://vetmed.iastate.edu/vmc/clinical-trials/ | Lloyd Veterinary Medical Center |
| 20 | Kansas State University | https://www.ksvhc.org/services/clinical-trials/ | Veterinary Health Center; email: ClinicalTrials@vet.k-state.edu |
| 21 | Louisiana State University | https://www.lsu.edu/vetmed/veterinary_hospital/clinical_trials.php | Center for Clinical Innovation |
| 22 | Oregon State University | https://vetmed.oregonstate.edu/hospital/oncology/clinical-trials | Carlson College; oncology-focused trials page |
| 23 | Washington State University | https://vcs.vetmed.wsu.edu/research/clinical-studies | Active in IBD, gastroenterology research |
| 24 | Virginia-Maryland College (Virginia Tech) | https://research.vetmed.vt.edu/clinical-trials.html | Veterinary Clinical Research Office |
| 25 | Oklahoma State University | https://vetmed.okstate.edu/ | Listed by Vet Cancer Society; trials page TBD (may be embedded in departments) |

### Tier 2: Additional Academic & Medical Institutions

| # | Institution | Clinical Trials URL | Notes |
|---|------------|---------------------|-------|
| 26 | Johns Hopkins University (CIGAT) | https://www.hopkinsmedicine.org/radiology/veterinarians/clinical-trials | Center for Image-Guided Animal Therapy; strong osteosarcoma/glioma focus |
| 27 | University of Texas Southwestern | Trials listed via AVMA registry | Veterinary Research and Oncology Clinic; active in glioma, hemangiosarcoma |
| 28 | University of Arizona | https://vfce.arizona.edu/valley-fever-dogs/clinical-trials-dogs | Valley Fever Center; niche but active |

### Tier 3: Canadian Institutions

| # | Institution | Clinical Trials URL | Notes |
|---|------------|---------------------|-------|
| 29 | Ontario Veterinary College (Univ. of Guelph) | https://ovc.uoguelph.ca/clinicaltrials/ | Leading Canadian vet school; well-organized trials page |

### Tier 4: Major Private Specialty Hospitals & Referral Centers

| # | Institution | Clinical Trials URL | Notes |
|---|------------|---------------------|-------|
| 30 | Animal Medical Center (NYC) | https://www.amcny.org/current-clinical-trials/ | 20+ specialties; 50+ years of clinical trials |
| 31 | Cornell University Veterinary Specialists (Stamford, CT) | https://www.cuvs.org/clinical_trials | Satellite of Cornell |
| 32 | Bridge Animal Referral Center (BARC, Edmonds, WA) | Trials listed via AVMA | Active in multi-site pharma trials |
| 33 | Gulf Coast Veterinary Specialists (Houston) | Trials listed via AVMA | Multi-site trial participant |
| 34 | Red Bank Veterinary Hospital (NJ) | Trials listed via AVMA | Multi-site trial participant; local to NJ |
| 35 | SAGE Veterinary Centers (San Francisco) | Trials listed via AVMA | Multi-site trial participant |
| 36 | PetCure Oncology | Listed by Vet Cancer Society | Radiation oncology network |
| 37 | BluePearl Specialty + Emergency | Multi-site trial participant | Various locations participating in university-led trials |

### Tier 5: Centralized Registries & Directories (for cross-reference)

| # | Resource | URL | Notes |
|---|---------|-----|-------|
| 38 | AVMA Veterinary Clinical Trials Registry | https://veterinaryclinicaltrials.org/studies/ | The official (opt-in) registry |
| 39 | Veterinary Cancer Society Trials Directory | https://vetcancersociety.org/resources/clinical-trials/ | Link directory, oncology-focused |
| 40 | The Pet Fund Clinical Studies | https://thepetfund.com/for-pet-owners/clinical-studies | Link directory |
| 41 | The Perseus Foundation | https://www.theperseusfoundation.info/clinical-trials | Link directory |
| 42 | Canine Cancer Alliance | https://www.ccralliance.org/post/how-to-find-clinical-trials-for-dogs-with-cancer | Link directory with verified URLs |

---

## Product Architecture

### How It Works

```
[Scheduled Scraper] → [Raw HTML from 35+ sources]
        ↓
[Claude API Extraction Layer] → Structured JSON per trial
        ↓
[Database (PostgreSQL)] → Normalized trial records
        ↓
[Search Frontend] → Filterable, searchable UI for vets
        ↓
[Alert System] → Email/SMS when new trials match criteria
```

### Data Model (per trial record)

```
- trial_id (internal)
- source_institution
- source_url
- title
- species (dog, cat, horse, exotic, other)
- condition_category (oncology, cardiology, neurology, orthopedic, dermatology, gastroenterology, ophthalmology, behavioral, endocrine, infectious disease, other)
- condition_specific (e.g., "osteosarcoma", "lymphoma", "hemangiosarcoma")
- enrollment_status (recruiting, enrolled, completed, suspended)
- eligibility_summary (AI-generated plain English)
- eligibility_details (raw criteria)
- principal_investigator
- contact_email
- contact_phone
- location_city
- location_state
- financial_info (fully funded, partially funded, owner costs)
- last_scraped
- last_changed
- avma_registry_id (cross-reference if exists)
```

### Key Features

1. **Universal Search** — Search across ALL institutions by condition, species, location, enrollment status
2. **Smart Matching** — Vet enters a patient profile (species, breed, diagnosis, age, weight, location) and gets matched trials ranked by eligibility
3. **Change Detection** — Daily scraping detects new trials, closed trials, and changes to existing trials
4. **Alert Subscriptions** — Vets subscribe to condition+species combinations and get notified when new trials open
5. **AVMA Cross-Reference** — Flag which trials are also listed in the AVMA registry vs. only on the school's own website (highlighting coverage gaps)
6. **Distance Calculator** — Show trials sorted by distance from the vet's or pet owner's location
7. **Shareable Trial Cards** — One-click generate a printable/emailable trial summary card for pet owners

### Tech Stack (Recommended)

- **Backend:** Python (FastAPI) + PostgreSQL
- **Scraping:** Playwright/Puppeteer for JS-rendered pages + BeautifulSoup for static HTML
- **AI Layer:** Claude API for HTML→structured data extraction
- **Frontend:** Next.js or React
- **Hosting:** Vercel (frontend) + Railway or Render (backend)
- **Scheduling:** Cron jobs or Celery for daily/weekly scraping
- **Alerts:** SendGrid for email notifications

### Build Phases

**Phase 1: Proof of Concept (1-2 weeks)**
- Scrape 5 top schools (Penn, Cornell, CSU, Ohio State, UC Davis)
- Claude API extraction pipeline
- Basic searchable database
- Simple web UI with filters

**Phase 2: Full Coverage (2-3 weeks)**
- Expand to all 35+ sources
- AVMA registry cross-reference
- Smart patient matching
- Alert system

**Phase 3: Polish & Launch (1-2 weeks)**
- Distance calculator
- Shareable trial cards
- Mobile-responsive design
- SEO / public launch

---

## Business Model Options

1. **Free tool / community goodwill play** — Build reputation in vet community; lead gen for NisonCo AI consulting
2. **Freemium SaaS** — Basic search free; premium features (alerts, smart matching, API access) at $29-49/month for clinics
3. **Institutional licensing** — Sell to vet schools, pharma companies, or specialty practices
4. **Sponsorship model** — Free for vets; pharma companies pay to promote their trials
5. **Partnership with AVMA** — Propose this as a data quality/completeness layer for the existing registry

## Why This Wins

- The AVMA registry is opt-in and incomplete. This tool scrapes directly from the source.
- No vet wants to visit 30 websites. This is a clear time-saver.
- The AI extraction layer means we can handle wildly different page formats without building custom parsers for each school.
- Oncology is the highest-urgency use case (time-sensitive, high-stakes), but the tool naturally expands to all specialties.
- Comparative medicine angle: many vet trials have human medicine implications, opening doors to pharma partnerships.

---

## Next Steps

1. [ ] Build POC scraper for 5 schools
2. [ ] Test Claude API extraction accuracy on real trial pages
3. [ ] Design database schema
4. [ ] Build minimal frontend
5. [ ] Get feedback from the oncologist who suggested this
6. [ ] Decide on business model
7. [ ] Name the product (working title: VetTrials)
