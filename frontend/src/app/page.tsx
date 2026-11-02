import type { Metadata } from "next";
import HomeSearch from "./HomeSearch";

export const metadata: Metadata = {
  title: { absolute: "Veterinary Clinical Trials for Dogs, Cats & Horses | VetTrials" },
  description:
    "Find veterinary clinical trial listings for dogs, cats and horses. Search by condition, species or location, then confirm study details with the institution.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "VetTrials",
    url: "/",
    title: "Veterinary Clinical Trials for Dogs, Cats & Horses | VetTrials",
    description:
      "Search veterinary research listings by species, condition and location. Confirm availability and eligibility with the study institution.",
  },
  twitter: {
    card: "summary",
    title: "Veterinary Clinical Trials for Dogs, Cats & Horses | VetTrials",
    description:
      "Search veterinary research listings by species, condition and location. Confirm study details with the institution.",
  },
};

export default function HomePage() {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-text">
          Find veterinary clinical trials
        </h1>
        <p className="mt-2 text-muted max-w-3xl">
          Search veterinary research listings for dogs, cats, horses, and other
          animals in one free directory. Every listing links to its source so you
          can follow up with the institution conducting the study.
        </p>
        <nav aria-label="Browse trials by animal" className="mt-5 grid gap-2 sm:grid-cols-3 max-w-3xl">
          {[
            ["dog", "dogs"],
            ["cat", "cats"],
            ["horse", "horses"],
          ].map(([species, label]) => (
            <a
              key={species}
              href={`/?species=${species}#trial-search`}
              className="rounded-lg border border-primary/20 bg-surface px-4 py-3 font-medium text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Clinical trials for {label}
            </a>
          ))}
        </nav>
      </section>
      <div id="trial-search" className="scroll-mt-4">
        <HomeSearch />
      </div>
      <section id="how-to-search" aria-labelledby="trials-explained" className="max-w-7xl mx-auto px-4 py-8 scroll-mt-4 border-t border-primary/10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 id="trials-explained" className="text-2xl font-bold text-text">
              What are veterinary clinical trials?
            </h2>
            <p className="mt-3 text-muted leading-relaxed">
              Veterinary clinical trials are research studies involving animals.
              They evaluate treatments, diagnostic tests, medical devices, or
              procedures to answer questions about animal health. Participation
              does not guarantee a benefit for an individual animal.
            </p>
            <p className="mt-3 text-muted leading-relaxed">
              Discuss a study with your veterinarian and the research team before
              deciding whether to take part. Ask about eligibility, possible
              risks, costs, and required visits. Cornell&apos;s{" "}
              <a href="https://www.vet.cornell.edu/hospitals/clinical-trials/frequently-asked-questions" className="text-primary underline underline-offset-4">
                clinical trial questions and answers
              </a>{" "}
              explain what to consider.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text">How to search VetTrials</h2>
            <ol className="mt-3 list-decimal pl-5 space-y-3 text-muted leading-relaxed">
              <li>
                Start with a species above or type a condition or treatment into
                the search box. For example, search for{" "}
                <a href="/?q=lymphoma#trial-search" className="text-primary underline underline-offset-4">lymphoma</a>.
              </li>
              <li>
                Narrow the results by condition, state, institution, or listed
                enrollment status. On a phone, tap Show Filters. You can also browse{" "}
                <a href="/?species=dog&condition=oncology#trial-search" className="text-primary underline underline-offset-4">dog oncology trials</a>,{" "}
                <a href="/?species=cat&condition=nephrology#trial-search" className="text-primary underline underline-offset-4">cat kidney trials</a>, or{" "}
                <a href="/?species=horse#trial-search" className="text-primary underline underline-offset-4">horse trials</a>.
              </li>
              <li>
                Open a listing and follow its institution link. Confirm whether
                the study is accepting patients and what participation involves.
                A Recruiting label in this directory is not confirmation of an
                available place.
              </li>
            </ol>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted leading-relaxed max-w-4xl">
          VetTrials is an independent discovery tool, not an enrolling institution.
          Listings can be out of date or contain errors. VetTrials is not affiliated
          with the American Veterinary Medical Association (AVMA) or the institutions
          listed here. Read more <a href="/about" className="text-primary underline underline-offset-4">about VetTrials</a>.
        </p>
      </section>
    </>
  );
}
