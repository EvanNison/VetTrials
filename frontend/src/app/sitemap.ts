import type { MetadataRoute } from "next";
import type { TrialSearchResponse } from "@/types";
import { absoluteUrl, serverApiUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const staticPages: MetadataRoute.Sitemap = [
  { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
  { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
  { url: absoluteUrl("/alerts"), changeFrequency: "monthly", priority: 0.5 },
  { url: absoluteUrl("/status"), changeFrequency: "daily", priority: 0.5 },
  { url: absoluteUrl("/legal"), changeFrequency: "yearly", priority: 0.2 },
];

async function getActiveTrials(): Promise<
  NonNullable<TrialSearchResponse["data"]>["trials"]
> {
  const firstResponse = await fetch(serverApiUrl("/api/trials?limit=100&page=1"), {
    cache: "no-store",
  });

  if (!firstResponse.ok) {
    throw new Error(`Trial sitemap request failed with ${firstResponse.status}`);
  }

  const firstPage = (await firstResponse.json()) as TrialSearchResponse;
  if (!firstPage.data) return [];

  const remainingPages = Array.from(
    { length: Math.max(0, firstPage.data.pagination.totalPages - 1) },
    (_, index) => index + 2,
  );
  const remainingResponses = await Promise.all(
    remainingPages.map(async (page) => {
      const response = await fetch(
        serverApiUrl(`/api/trials?limit=100&page=${page}`),
        { cache: "no-store" },
      );
      if (!response.ok) return [];
      const result = (await response.json()) as TrialSearchResponse;
      return result.data?.trials ?? [];
    }),
  );

  return [firstPage.data.trials, ...remainingResponses].flat();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const trials = await getActiveTrials();
    const trialPages: MetadataRoute.Sitemap = trials.map((trial) => ({
      url: absoluteUrl(`/trial/${trial.id}`),
      lastModified: trial.updatedAt || trial.lastSeen,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...trialPages];
  } catch (error) {
    console.error("[SITEMAP] Unable to load trial URLs", error);
    return staticPages;
  }
}
