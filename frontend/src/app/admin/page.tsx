"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  verifySession,
  logout,
  triggerScrape,
  getScrapeStatus,
  getSources,
  getRuns,
  getCosts,
  getSchedule,
  updateSchedule,
  getChanges,
  type RunEntry,
  type CostData,
  type ScheduleData,
  type ChangeData,
  type SourceEntry,
} from "@/lib/admin-api";
import { apiUrl } from "@/lib/api-base";

type Tab = "overview" | "runs" | "costs" | "schedule" | "changes";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    verifySession().then((valid) => {
      if (!valid) {
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Verifying session...</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "runs", label: "Run History" },
    { id: "costs", label: "Costs" },
    { id: "schedule", label: "Schedule" },
    { id: "changes", label: "Changes" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg"
        >
          Sign Out
        </button>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && <OverviewPanel />}
      {activeTab === "runs" && <RunsPanel />}
      {activeTab === "costs" && <CostsPanel />}
      {activeTab === "schedule" && <SchedulePanel />}
      {activeTab === "changes" && <ChangesPanel />}
    </div>
  );
}

// ─── Overview Panel ──────────────────────────────────────────────────────────

function OverviewPanel() {
  const [scraping, setScraping] = useState(false);
  const [message, setMessage] = useState("");
  const [runningJobs, setRunningJobs] = useState<Array<{ id: number; startedAt: string; source: { name: string; shortName: string } }>>([]);
  const [stats, setStats] = useState<{ totalTrials: number; activeTrials: number; totalSources: number; activeSources: number } | null>(null);
  const [sources, setSources] = useState<SourceEntry[]>([]);
  const [scrapingSource, setScrapingSource] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [scrapingSelected, setScrapingSelected] = useState(false);

  const runningShortNames = new Set(runningJobs.map((j) => j.source.shortName));

  const refreshStatus = useCallback(async () => {
    try {
      const [statusData, statsRes, sourcesData] = await Promise.all([
        getScrapeStatus(),
        fetch(apiUrl("/api/stats")).then((r) => r.json()),
        getSources(),
      ]);
      setRunningJobs(statusData?.running || []);
      setStats(statsRes.data);
      setSources(sourcesData);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 10000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  async function handleFullRefresh() {
    setScraping(true);
    setMessage("");
    const result = await triggerScrape();
    setMessage(result.message || result.error || "");
    setTimeout(refreshStatus, 2000);
    setScraping(false);
  }

  async function handleSingleScrape(shortName: string) {
    setScrapingSource(shortName);
    setMessage("");
    const result = await triggerScrape(shortName);
    setMessage(result.message || result.error || "");
    setTimeout(refreshStatus, 2000);
    setScrapingSource(null);
  }

  async function handleScrapeSelected() {
    if (selectedSources.size === 0) return;
    setScrapingSelected(true);
    setMessage("");
    const names = Array.from(selectedSources);
    const result = await triggerScrape(names.join(","));
    setMessage(result.message || result.error || "");
    setSelectedSources(new Set());
    setTimeout(refreshStatus, 2000);
    setScrapingSelected(false);
  }

  function toggleSource(shortName: string) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(shortName)) next.delete(shortName);
      else next.add(shortName);
      return next;
    });
  }

  function selectAllFailed() {
    const failed = sources.filter((s) => s.lastError && (!s.lastSuccess || (s.lastScraped && new Date(s.lastScraped) > new Date(s.lastSuccess)))).map((s) => s.shortName);
    setSelectedSources(new Set(failed));
  }

  // Determine which sources have errors (last run was an error)
  function sourceHasError(s: SourceEntry): boolean {
    if (!s.lastError) return false;
    if (!s.lastSuccess) return true;
    if (!s.lastScraped) return false;
    return new Date(s.lastScraped) > new Date(s.lastSuccess);
  }

  const failedCount = sources.filter(sourceHasError).length;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Trials" value={stats.activeTrials} />
          <StatCard label="Total Trials" value={stats.totalTrials} />
          <StatCard label="Active Sources" value={stats.activeSources} />
          <StatCard label="Total Sources" value={stats.totalSources} />
        </div>
      )}

      {/* Scrape controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Refresh</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleFullRefresh}
            disabled={scraping}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {scraping ? "Starting..." : "Trigger Full Refresh"}
          </button>
          {selectedSources.size > 0 && (
            <button
              onClick={handleScrapeSelected}
              disabled={scrapingSelected}
              className="px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {scrapingSelected ? "Starting..." : `Re-run ${selectedSources.size} Selected`}
            </button>
          )}
          {failedCount > 0 && selectedSources.size === 0 && (
            <button
              onClick={selectAllFailed}
              className="px-4 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Select {failedCount} Failed
            </button>
          )}
          {selectedSources.size > 0 && (
            <button
              onClick={() => setSelectedSources(new Set())}
              className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Selection
            </button>
          )}
          {message && <span className="text-sm text-green-600">{message}</span>}
        </div>

        {runningJobs.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Scrape in progress ({runningJobs.length} source{runningJobs.length > 1 ? "s" : ""})
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {runningJobs.map((job) => (
                <li key={job.id}>
                  {job.source.name}, started {timeAgo(job.startedAt)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Per-source table */}
      {sources.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <h3 className="px-4 py-3 font-semibold text-gray-900 bg-gray-50 border-b border-gray-200">
            Sources ({sources.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th className="w-10 px-4 py-2"></th>
                  <th className="text-left px-4 py-2 font-medium">Source</th>
                  <th className="text-right px-4 py-2 font-medium">Trials</th>
                  <th className="text-left px-4 py-2 font-medium">Last Run</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Error</th>
                  <th className="text-right px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((s) => {
                  const hasError = sourceHasError(s);
                  const isRunning = runningShortNames.has(s.shortName);
                  const isStarting = scrapingSource === s.shortName;
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 ${hasError ? "bg-red-50/50" : ""}`}>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSources.has(s.shortName)}
                          onChange={() => toggleSource(s.shortName)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-gray-900">{s.shortName}</span>
                        <span className="ml-2 text-gray-500">{s.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{s.trialCount}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {s.lastScraped ? timeAgo(s.lastScraped) : "Never"}
                      </td>
                      <td className="px-4 py-2.5">
                        {isRunning ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Running</span>
                        ) : hasError ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">Error</span>
                        ) : s.lastSuccess ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">OK</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-red-600 max-w-[200px] truncate" title={s.lastError || ""}>
                        {hasError ? (s.lastError || "").slice(0, 50) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleSingleScrape(s.shortName)}
                          disabled={isStarting || isRunning}
                          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 transition-colors"
                        >
                          {isRunning ? "Running..." : isStarting ? "Starting..." : "Re-run"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Runs Panel ──────────────────────────────────────────────────────────────

function RunsPanel() {
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRuns = useCallback(async (page = 1) => {
    setLoading(true);
    const data = await getRuns({ page, limit: 25, status: statusFilter || undefined });
    if (data) {
      setRuns(data.runs);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadRuns(1);
  }, [loadRuns]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="running">Running</option>
        </select>
        <span className="text-sm text-gray-500">
          {pagination.total} total runs
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Started</th>
                <th className="text-right px-4 py-3 font-medium">Found</th>
                <th className="text-right px-4 py-3 font-medium">New</th>
                <th className="text-right px-4 py-3 font-medium">Updated</th>
                <th className="text-right px-4 py-3 font-medium">Removed</th>
                <th className="text-right px-4 py-3 font-medium">Tokens</th>
                <th className="text-left px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : runs.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">No runs found</td></tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{run.source.shortName}</td>
                    <td className="px-4 py-2.5">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{timeAgo(run.startedAt)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{run.trialsFound ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-green-600">{run.trialsNew ? `+${run.trialsNew}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-blue-600">{run.trialsUpdated || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">{run.trialsRemoved ? `-${run.trialsRemoved}` : "—"}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{run.extractionTokens?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-2.5 text-red-600 max-w-[200px] truncate" title={run.errorMessage || ""}>
                      {run.errorMessage ? run.errorMessage.slice(0, 60) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => loadRuns(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => loadRuns(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Costs Panel ─────────────────────────────────────────────────────────────

function CostsPanel() {
  const [costs, setCosts] = useState<CostData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCosts(days).then((data) => {
      setCosts(data);
      setLoading(false);
    });
  }, [days]);

  if (loading || !costs) {
    return <p className="text-gray-400 py-8 text-center">Loading cost data...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Period:</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Runs" value={costs.totals.runs} />
        <StatCard label="Total Tokens" value={costs.totals.tokens.toLocaleString()} />
        <StatCard label="Estimated Cost" value={`$${costs.totals.estimatedCostUsd.toFixed(4)}`} />
      </div>

      {/* Per-source breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="px-4 py-3 font-semibold text-gray-900 bg-gray-50 border-b border-gray-200">
          Cost by Source
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Source</th>
                <th className="text-right px-4 py-2 font-medium">Runs</th>
                <th className="text-right px-4 py-2 font-medium">Tokens</th>
                <th className="text-right px-4 py-2 font-medium">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costs.bySource.map((row) => (
                <tr key={row.source.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{row.source.name}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{row.runs}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{Number(row.tokens).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-gray-900">${row.estimatedCostUsd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily breakdown */}
      {costs.byDay.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <h3 className="px-4 py-3 font-semibold text-gray-900 bg-gray-50 border-b border-gray-200">
            Daily Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-right px-4 py-2 font-medium">Runs</th>
                  <th className="text-right px-4 py-2 font-medium">Tokens</th>
                  <th className="text-right px-4 py-2 font-medium">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {costs.byDay.map((row) => (
                  <tr key={row.day} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{row.day}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{row.runs}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{row.tokens.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-900">${row.estimatedCostUsd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Schedule Panel ──────────────────────────────────────────────────────────

function SchedulePanel() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [cronInput, setCronInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchedule().then((data) => {
      setSchedule(data);
      setCronInput(data.cronExpression);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const result = await updateSchedule({ cronExpression: cronInput, enabled: true });
      setSchedule(result);
      setMessage("Schedule updated successfully");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update");
    }
    setSaving(false);
  }

  async function handleToggle() {
    if (!schedule) return;
    setSaving(true);
    setMessage("");
    try {
      const result = await updateSchedule({ enabled: !schedule.enabled });
      setSchedule(result);
      setMessage(result.enabled ? "Schedule enabled" : "Schedule disabled");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update");
    }
    setSaving(false);
  }

  if (loading || !schedule) {
    return <p className="text-gray-400 py-8 text-center">Loading schedule...</p>;
  }

  const presets = [
    { label: "Every 6 hours", cron: "0 */6 * * *" },
    { label: "Daily at 07:00 UTC", cron: "0 7 * * *" },
    { label: "Daily at midnight", cron: "0 0 * * *" },
    { label: "Twice daily (07:00 & 19:00 UTC)", cron: "0 7,19 * * *" },
    { label: "Every 12 hours", cron: "0 */12 * * *" },
    { label: "Weekly (Sunday 07:00 UTC)", cron: "0 7 * * 0" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Scrape Schedule</h2>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              schedule.enabled
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {schedule.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cron Expression
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={cronInput}
                onChange={(e) => setCronInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0 3 * * *"
              />
              <button
                onClick={handleSave}
                disabled={saving || cronInput === schedule.cronExpression}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Format: minute hour day-of-month month day-of-week (UTC)
            </p>
          </div>

          {schedule.nextRun && (
            <p className="text-sm text-gray-600">
              Next run: <span className="font-medium">{schedule.nextRun}</span>
            </p>
          )}

          {message && (
            <p className={`text-sm ${message.includes("Failed") || message.includes("Invalid") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}

          {/* Presets */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.cron}
                  onClick={() => setCronInput(preset.cron)}
                  className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                    cronInput === preset.cron
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Production scheduling info */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Production Scheduling</h3>
        <p className="text-sm text-blue-800 mb-3">
          On Replit Autoscale, use the GitHub Actions scheduled scraper for reliable scrapes
          without keeping a Reserved VM running. Internal node-cron is only reliable when the
          web process is deliberately kept alive.
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Workflow:
            <code className="block mt-1 bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono break-all">
              .github/workflows/scrape.yml
            </code>
          </li>
          <li>Scheduled command:
            <code className="block mt-1 bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono break-all">
              npm run scrape:all
            </code>
          </li>
          <li>Enable internal scheduling only for an always-on process by setting
            <code className="ml-1 bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">
              ENABLE_INTERNAL_SCHEDULER=true
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ─── Changes Panel ───────────────────────────────────────────────────────────

function ChangesPanel() {
  const [changes, setChanges] = useState<ChangeData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getChanges(days).then((data) => {
      setChanges(data);
      setLoading(false);
    });
  }, [days]);

  if (loading || !changes) {
    return <p className="text-gray-400 py-8 text-center">Loading changes...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Period:</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="New Trials" value={changes.newTrials.count} color="green" />
        <StatCard label="Updated Trials" value={changes.updatedTrials.count} color="blue" />
        <StatCard label="Removed Trials" value={changes.removedTrials.count} color="red" />
      </div>

      {/* New trials */}
      {changes.newTrials.trials.length > 0 && (
        <ChangeTable
          title="New Trials"
          trials={changes.newTrials.trials.map((t) => ({
            id: t.id,
            title: t.title,
            source: t.source.name,
            date: t.firstSeen,
          }))}
          color="green"
        />
      )}

      {/* Updated trials */}
      {changes.updatedTrials.trials.length > 0 && (
        <ChangeTable
          title="Updated Trials"
          trials={changes.updatedTrials.trials.map((t) => ({
            id: t.id,
            title: t.title,
            source: t.source.name,
            date: t.lastChanged,
          }))}
          color="blue"
        />
      )}

      {/* Removed trials */}
      {changes.removedTrials.trials.length > 0 && (
        <ChangeTable
          title="Removed Trials"
          trials={changes.removedTrials.trials.map((t) => ({
            id: t.id,
            title: t.title,
            source: t.source.name,
            date: t.updatedAt,
          }))}
          color="red"
        />
      )}
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass = color === "green" ? "text-green-600" : color === "blue" ? "text-blue-600" : color === "red" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    running: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function ChangeTable({
  title,
  trials,
  color,
}: {
  title: string;
  trials: Array<{ id: number; title: string; source: string; date: string }>;
  color: string;
}) {
  const borderColor = color === "green" ? "border-green-200" : color === "blue" ? "border-blue-200" : "border-red-200";
  const headerBg = color === "green" ? "bg-green-50" : color === "blue" ? "bg-blue-50" : "bg-red-50";

  return (
    <div className={`bg-white rounded-xl border ${borderColor} overflow-hidden`}>
      <h3 className={`px-4 py-3 font-semibold text-gray-900 ${headerBg} border-b ${borderColor}`}>
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-600">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Title</th>
              <th className="text-left px-4 py-2 font-medium">Source</th>
              <th className="text-left px-4 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trials.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">
                  <a href={`/trial/${t.id}`} className="hover:text-blue-600 hover:underline">
                    {t.title.length > 80 ? t.title.slice(0, 80) + "..." : t.title}
                  </a>
                </td>
                <td className="px-4 py-2 text-gray-600">{t.source}</td>
                <td className="px-4 py-2 text-gray-500">{timeAgo(t.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
