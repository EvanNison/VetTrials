import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Source Status",
  description:
    "See the veterinary institutions covered by VetTrials and when their listings were last verified.",
  alternates: { canonical: "/status" },
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
