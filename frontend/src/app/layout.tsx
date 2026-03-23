import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "VetTrials — Veterinary Clinical Trials Search",
  description:
    "Search veterinary clinical trials from 30+ university and institutional sources. Find recruiting studies for dogs, cats, horses, and more.",
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
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-primary/5 border-t border-primary/10 py-6 text-sm text-muted">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                VetTrials aggregates clinical trial listings from 30+
                veterinary institutions.
              </span>
              <span>
                Data refreshed daily. Not a substitute for veterinary advice.
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
