import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinical Trial Alerts",
  description:
    "Get notified when new veterinary clinical trials match your interests.",
  alternates: { canonical: "/alerts" },
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
