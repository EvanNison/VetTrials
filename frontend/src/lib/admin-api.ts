import { apiUrl } from "./api-base";

const TOKEN_KEY = "vettrials_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(apiUrl(`/api/admin${path}`), { ...options, headers });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  }
  return res;
}

export async function login(password: string): Promise<{ token?: string; error?: string }> {
  const res = await fetch(apiUrl("/api/admin/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (json.data?.token) {
    setToken(json.data.token);
    return { token: json.data.token };
  }
  return { error: json.error || "Login failed" };
}

export async function logout(): Promise<void> {
  await adminFetch("/logout", { method: "POST" }).catch(() => {});
  clearToken();
}

export async function verifySession(): Promise<boolean> {
  try {
    const res = await adminFetch("/verify");
    return res.ok;
  } catch {
    return false;
  }
}

export async function triggerScrape(source?: string): Promise<{ message?: string; error?: string }> {
  const url = source ? `/scrape?source=${encodeURIComponent(source)}` : "/scrape";
  const res = await adminFetch(url, { method: "POST" });
  const json = await res.json();
  return json.data || { error: json.error };
}

export async function getScrapeStatus(): Promise<{ running: Array<{ id: number; startedAt: string; source: { name: string; shortName: string } }> }> {
  const res = await adminFetch("/scrape-status");
  const json = await res.json();
  return json.data;
}

export interface RunEntry {
  id: number;
  sourceId: number;
  startedAt: string;
  completedAt: string | null;
  status: string;
  trialsFound: number | null;
  trialsNew: number | null;
  trialsUpdated: number | null;
  trialsRemoved: number | null;
  extractionTokens: number | null;
  extractionModel: string | null;
  errorMessage: string | null;
  source: { id: number; name: string; shortName: string };
}

export async function getRuns(params?: { page?: number; limit?: number; sourceId?: number; status?: string }): Promise<{
  runs: RunEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.sourceId) query.set("sourceId", String(params.sourceId));
  if (params?.status) query.set("status", params.status);
  const res = await adminFetch(`/runs?${query}`);
  const json = await res.json();
  return json.data;
}

export interface CostData {
  period: { days: number; since: string };
  totals: { runs: number; tokens: number; estimatedCostUsd: number };
  bySource: Array<{
    source: { id: number; name: string; shortName: string };
    runs: number;
    tokens: number;
    estimatedCostUsd: number;
  }>;
  byDay: Array<{ day: string; tokens: number; runs: number; estimatedCostUsd: number }>;
}

export async function getCosts(days?: number): Promise<CostData> {
  const res = await adminFetch(`/costs?days=${days || 30}`);
  const json = await res.json();
  return json.data;
}

export interface ScheduleData {
  cronExpression: string;
  enabled: boolean;
  nextRun: string | null;
  lastPersisted: string | null;
}

export async function getSchedule(): Promise<ScheduleData> {
  const res = await adminFetch("/schedule");
  const json = await res.json();
  return json.data;
}

export async function updateSchedule(data: { cronExpression?: string; enabled?: boolean }): Promise<ScheduleData & { message?: string }> {
  const res = await adminFetch("/schedule", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export interface ChangeData {
  period: { days: number; since: string };
  newTrials: { count: number; trials: Array<{ id: number; title: string; firstSeen: string; source: { name: string; shortName: string } }> };
  updatedTrials: { count: number; trials: Array<{ id: number; title: string; lastChanged: string; source: { name: string; shortName: string } }> };
  removedTrials: { count: number; trials: Array<{ id: number; title: string; updatedAt: string; source: { name: string; shortName: string } }> };
}

export interface SourceEntry {
  id: number;
  name: string;
  shortName: string;
  tier: number;
  trialCount: number;
  lastScraped: string | null;
  lastSuccess: string | null;
  lastError: string | null;
}

export async function getSources(): Promise<SourceEntry[]> {
  const res = await fetch(apiUrl("/api/sources"));
  const json = await res.json();
  return json.data || [];
}

export async function getChanges(days?: number): Promise<ChangeData> {
  const res = await adminFetch(`/changes?days=${days || 7}`);
  const json = await res.json();
  return json.data;
}
