import type { Metadata } from "next";
import type { Trial } from "@/types";
import { serverApiUrl } from "@/lib/site";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

async function getTrial(id: string): Promise<Trial | null> {
  try {
    const response = await fetch(serverApiUrl(`/api/trials/${id}`), {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const result = (await response.json()) as {
      data: Trial | null;
      error: string | null;
    };
    return result.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `/trial/${id}`;
  const trial = await getTrial(id);

  if (!trial) {
    return {
      title: "Clinical Trial",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  const location = [trial.locationCity, trial.locationState]
    .filter(Boolean)
    .join(", ");
  const sourceSummary = `Veterinary clinical trial from ${trial.source.name}${
    location ? ` in ${location}` : ""
  }.`;
  const description = `${trial.eligibilitySummary || ""} ${sourceSummary}`
    .trim()
    .slice(0, 160);

  return {
    title: trial.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: trial.title,
      description,
    },
  };
}

export default function TrialLayout({ children }: Props) {
  return children;
}
