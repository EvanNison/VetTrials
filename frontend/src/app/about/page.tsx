import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how VetTrials aggregates veterinary clinical trials from 30+ universities and institutions.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-text mb-6">About VetTrials</h1>

      <section className="prose prose-sm max-w-none space-y-5 text-text">
        <p className="text-base">
          VetTrials is a free aggregator of veterinary clinical trials. We pull
          listings from 30+ veterinary schools and institutions
          into a single searchable interface so vets, pet owners, and
          researchers can find studies in minutes instead of clicking through
          dozens of university websites.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Why this exists</h2>
        <p>
          Clinical trials are how new veterinary treatments come to market, and
          they&apos;re often free or subsidized for participating pets. But
          today, finding them is a manual scavenger hunt across institutional
          websites with no shared format. Veterinary oncologists in particular
          spend real time on this. We thought the data should be aggregated
          once, openly, and made available to everyone.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">How it works</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            A scheduled scraper visits each source&apos;s public clinical-trials
            page (no logins, no scraping behind paywalls).
          </li>
          <li>
            The page HTML is sent to Anthropic&apos;s Claude model with a
            structured-extraction prompt that returns trial data as JSON.
          </li>
          <li>
            The data is normalized (species names standardized, conditions
            categorized, locations mapped) and stored in a Postgres database.
          </li>
          <li>
            This site shows the aggregated results. Every trial card links back
            to the original source page so enrollment goes through the
            institution.
          </li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-2">What we don&apos;t do</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>We don&apos;t replace direct contact with institutions.</strong>{" "}
            VetTrials is a discovery tool. Enrollment, eligibility verification,
            and treatment all happen with the institution.
          </li>
          <li>
            <strong>We don&apos;t guarantee accuracy.</strong> Data is scraped
            and AI-extracted; it can be stale or wrong. Always confirm details
            with the source institution before making medical decisions.
          </li>
          <li>
            <strong>We don&apos;t scrape patient data.</strong> The only
            personal information we ingest is the publicly-listed contact info
            for principal investigators.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          Feedback and feature requests
        </h2>
        <p>
          Have an idea that would make VetTrials more useful? Send a{" "}
          <a
            href="mailto:evan@nisonco.com?subject=VetTrials%20feature%20request"
            className="text-primary hover:underline"
          >
            feature request
          </a>
          , suggest a new data source, or tell us what is getting in your way.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Who built this</h2>
        <p>
          VetTrials was built by{" "}
          <a
            href="https://github.com/EvanNison"
            className="text-primary hover:underline"
          >
            Evan Nison
          </a>{" "}
          at <a href="https://nisonco.com" className="text-primary hover:underline">NisonCo</a>{" "}
          as an AI-consulting side project that grew into something we hope is
          genuinely useful. If it is, we&apos;d love to hear from you.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Independence</h2>
        <p>
          VetTrials is an independent project and is{" "}
          <strong>not affiliated with</strong> the American Veterinary Medical
          Association (AVMA) or its{" "}
          <a
            href="https://veterinaryclinicaltrials.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            veterinaryclinicaltrials.org
          </a>{" "}
          registry, the universities we list, or any of the institutions whose
          trials appear here. The AVMA registry is one of our 30+ sources, and
          we link back to it (and to every other source) on every trial card.
          If you&apos;re looking for the official AVMA registry directly, visit
          their site.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p>
          General questions, partnership ideas, or feedback:{" "}
          <a
            href="mailto:evan@nisonco.com"
            className="text-primary hover:underline"
          >
            evan@nisonco.com
          </a>
          .
        </p>
        <p>
          Institutions that would like to be removed, prefer a different scrape
          cadence, or want to provide a structured data feed: see our{" "}
          <a href="/legal" className="text-primary hover:underline">
            takedown and data-use policy
          </a>
          .
        </p>
      </section>
    </div>
  );
}
