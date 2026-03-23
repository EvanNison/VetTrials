import type { Trial, FilterData, TrialSearchResponse, SourceStatus } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface SearchParams {
  q?: string;
  species?: string[];
  condition?: string[];
  status?: string[];
  state?: string;
  institution?: string;
  page?: number;
  limit?: number;
}

export async function searchTrials(params: SearchParams): Promise<TrialSearchResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.species?.length) query.set("species", params.species.join(","));
  if (params.condition?.length) query.set("condition", params.condition.join(","));
  if (params.status?.length) query.set("status", params.status.join(","));
  if (params.state) query.set("state", params.state);
  if (params.institution) query.set("institution", params.institution);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/api/trials?${query}`);
  if (!res.ok) throw new Error("Failed to fetch trials");
  return res.json();
}

export async function getTrial(id: number): Promise<{ data: Trial | null; error: string | null }> {
  const res = await fetch(`${API_BASE}/api/trials/${id}`);
  if (!res.ok) throw new Error("Failed to fetch trial");
  return res.json();
}

export async function getFilters(): Promise<{ data: FilterData | null; error: string | null }> {
  const res = await fetch(`${API_BASE}/api/filters`);
  if (!res.ok) throw new Error("Failed to fetch filters");
  return res.json();
}

export async function getSources(): Promise<{ data: SourceStatus[] | null; error: string | null }> {
  const res = await fetch(`${API_BASE}/api/sources`);
  if (!res.ok) throw new Error("Failed to fetch sources");
  return res.json();
}

export async function getStats(): Promise<{ data: { totalTrials: number; activeTrials: number; totalSources: number; activeSources: number } | null; error: string | null }> {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function createSubscription(data: {
  email: string;
  speciesFilter: string[];
  conditionFilter: string[];
  stateFilter: string[];
}): Promise<{ data: { id: number; email: string; message: string } | null; error: string | null }> {
  const res = await fetch(`${API_BASE}/api/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
