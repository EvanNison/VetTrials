import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VetTrials: Search Veterinary Clinical Trials",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Search veterinary clinical trials from 30+ university and institutional sources. Find recruiting studies for dogs, cats, horses, and more.",
  applicationName: SITE_NAME,
  keywords: [
    "veterinary clinical trials",
    "animal clinical trials",
    "dog clinical trials",
    "cat clinical trials",
    "veterinary research studies",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "VetTrials: Search Veterinary Clinical Trials",
    description:
      "Find recruiting veterinary clinical trials for dogs, cats, horses, and other animals across 30+ institutions.",
  },
  twitter: {
    card: "summary",
    title: "VetTrials: Search Veterinary Clinical Trials",
    description:
      "Find recruiting veterinary clinical trials across 30+ institutions.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: googleSiteVerification
    ? { google: googleSiteVerification }
    : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <header className="bg-primary text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <span className="text-2xl font-bold tracking-tight">
                  VetTrials
                </span>
                <span className="hidden sm:inline text-sm text-white/70">
                  Veterinary Clinical Trials Search
                </span>
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a
                  href="/"
                  className="hover:text-white/80 transition-colors"
                >
                  Search
                </a>
                <a
                  href="/alerts"
                  className="hover:text-white/80 transition-colors"
                >
                  Alerts
                </a>
                <a
                  href="/status"
                  className="hover:text-white/80 transition-colors"
                >
                  Status
                </a>
                <a
                  href="/about"
                  className="hover:text-white/80 transition-colors"
                >
                  About
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-primary/5 border-t border-primary/10 py-6 text-sm text-muted">
            <div className="max-w-7xl mx-auto px-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>
                  VetTrials aggregates clinical trial listings from 30+
                  veterinary institutions.
                </span>
                <span>
                  Not a substitute for veterinary advice.
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs">
                <a
                  href="/about"
                  className="hover:text-primary transition-colors"
                >
                  About
                </a>
                <a
                  href="/legal"
                  className="hover:text-primary transition-colors"
                >
                  Legal &amp; Takedown
                </a>
                <a
                  href="mailto:evan@nisonco.com?subject=VetTrials%20feature%20request"
                  className="hover:text-primary transition-colors"
                >
                  Request a feature
                </a>
                <a
                  href="mailto:evan@nisonco.com"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </footer>
        </Providers>
        {googleAnalyticsId ? (
          <GoogleAnalytics gaId={googleAnalyticsId} />
        ) : null}
      </body>
    </html>
  );
}
