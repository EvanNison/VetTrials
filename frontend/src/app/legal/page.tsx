import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Takedown - VetTrials",
  description:
    "VetTrials data sourcing policy, takedown procedure, and contact information for institutions.",
};

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-text mb-6">
        Legal &amp; Data-Use Policy
      </h1>

      <section className="prose prose-sm max-w-none space-y-5 text-text">
        <p className="text-base">
          VetTrials aggregates publicly-posted veterinary clinical trial
          listings into a single searchable interface for the public-interest
          purpose of helping vets and pet owners find treatment options. This
          page describes how we collect data, how we use it, and how
          institutions can request changes.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">What we collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Trial titles, species, conditions, enrollment status, eligibility
            summaries, principal-investigator names, and listed contact info,
            all from public clinical-trials pages on each institution&apos;s
            website.
          </li>
          <li>
            We do <strong>not</strong> scrape behind logins, paywalls, or
            anti-bot measures.
          </li>
          <li>
            We do <strong>not</strong> collect patient data, owner data, or
            anything not visibly intended for public listing.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">How we scrape</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            We respect <code>robots.txt</code> on every source. Disallowed
            paths are skipped.
          </li>
          <li>
            We identify ourselves with a polite{" "}
            <code>User-Agent</code> header containing this site and a contact
            email, so admins can reach us before blocking.
          </li>
          <li>
            We rate-limit ourselves: one source at a time, with several seconds
            between requests, and we run scrapes off-peak.
          </li>
          <li>
            We always link back to the original source page. Enrollment and
            patient relationships stay with the institution.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          For institutions: takedown and feed requests
        </h2>
        <p>
          If you represent an institution we list and you&apos;d like any of
          the following, email{" "}
          <a
            href="mailto:evan@nisonco.com"
            className="text-primary hover:underline"
          >
            evan@nisonco.com
          </a>
          :
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Removal.</strong> We will remove your institution from our
            scrape list and delete cached data within 72 hours of a verified
            request from an authorized representative. No questions asked.
          </li>
          <li>
            <strong>Different scrape cadence.</strong> We default to a daily
            scrape. If that&apos;s too aggressive, tell us a cadence that
            works.
          </li>
          <li>
            <strong>Structured data feed.</strong> We&apos;d much rather ingest
            a clean RSS, JSON, or sitemap feed than scrape HTML. If you can
            provide one, we&apos;ll switch to it.
          </li>
          <li>
            <strong>Corrections.</strong> If we&apos;re displaying inaccurate
            information about a trial, let us know and we&apos;ll fix it.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          Independence and attribution
        </h2>
        <p>
          VetTrials is an independent project and is{" "}
          <strong>not affiliated with</strong>, endorsed by, or sponsored by
          the American Veterinary Medical Association (AVMA), its{" "}
          <a
            href="https://veterinaryclinicaltrials.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            veterinaryclinicaltrials.org
          </a>{" "}
          registry, any university we list, or any institution whose trials
          appear here. Where trials are sourced from the AVMA registry or any
          institutional partner, we attribute the source on the trial card and
          link back to the original listing.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Copyright</h2>
        <p>
          We store and display factual fields (trial titles, species,
          condition, status, contact info) and AI-generated summaries of
          eligibility criteria. We don&apos;t republish full original trial
          descriptions verbatim. If you believe content on this site infringes
          a copyright you hold, email us at the address above and we&apos;ll
          take it down promptly.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">No medical advice</h2>
        <p>
          VetTrials is a discovery tool, not medical advice. Always confirm
          trial eligibility, status, and details directly with the institution
          listed before making any treatment decisions for an animal in your
          care.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Self-hosting</h2>
        <p>
          The VetTrials codebase is open source under{" "}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            className="text-primary hover:underline"
          >
            AGPL-3.0
          </a>
          . Self-hosters are responsible for their own compliance with each
          source&apos;s terms of use and applicable law in their jurisdiction.
          The disclaimers and policies on this page apply to the canonical
          hosted instance at vettrials.org, not to forks or derivative
          deployments.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
        <p>
          All policy, takedown, and data-use questions:{" "}
          <a
            href="mailto:evan@nisonco.com"
            className="text-primary hover:underline"
          >
            evan@nisonco.com
          </a>
          .
        </p>

        <p className="text-sm text-muted mt-8">
          Last updated: {new Date().toISOString().slice(0, 10)}
        </p>
      </section>
    </div>
  );
}
