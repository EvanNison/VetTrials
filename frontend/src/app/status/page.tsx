"use client";

import { useQuery } from "@tanstack/react-query";
import { getSources, getStats } from "@/lib/api";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function latestAttemptFailed(source: {
  lastScraped: string | null;
  lastSuccess: string | null;
  lastError: string | null;
}): boolean {
  if (!source.lastError) return false;
  if (!source.lastSuccess) return true;
  if (!source.lastScraped) return false;
  return new Date(source.lastScraped) > new Date(source.lastSuccess);
}

function isStale(dateStr: string | null): boolean {
  if (!dateStr) return true;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  return ageMs > 7 * 24 * 60 * 60 * 1000;
}

export default function StatusPage() {
  const { data: sourcesData } = useQuery({
    queryKey: ["sources"],
    queryFn: getSources,
  });

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const sources = sourcesData?.data || [];
  const stats = statsData?.data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-2">Data Sources Status</h1>

      {stats && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-surface border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-2xl font-bold text-primary">{stats.activeTrials}</p>
            <p className="text-xs text-muted">Active Trials</p>
          </div>
          <div className="bg-surface border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-2xl font-bold text-secondary">{stats.activeSources}</p>
            <p className="text-xs text-muted">Data Sources</p>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-muted">
                Institution
              </th>
              <th className="text-center px-4 py-3 font-semibold text-muted">
                Trials
              </th>
              <th className="text-center px-4 py-3 font-semibold text-muted">
                Last Verified
              </th>
              <th className="text-center px-4 py-3 font-semibold text-muted">
                Last Attempt
              </th>
              <th className="text-center px-4 py-3 font-semibold text-muted">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr
                key={source.id}
                className="border-b border-gray-100 hover:bg-gray-50/50"
              >
                <td className="px-4 py-3">
                  <span className="font-medium">{source.shortName}</span>
                  <span className="text-muted ml-1 text-xs">
                    (Tier {source.tier})
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {source.trialCount}
                </td>
                <td className="px-4 py-3 text-center text-muted">
                  <span className={isStale(source.lastSuccess) ? "text-danger" : ""}>
                    {timeAgo(source.lastSuccess)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-muted">
                  {timeAgo(source.lastScraped)}
                </td>
                <td className="px-4 py-3 text-center">
                  {latestAttemptFailed(source) ? (
                    <span
                      className="text-danger"
                      title={source.lastError || undefined}
                    >
                      Failed
                    </span>
                  ) : source.lastSuccess ? (
                    <span className={isStale(source.lastSuccess) ? "text-warning" : "text-success"}>
                      {isStale(source.lastSuccess) ? "Stale" : "OK"}
                    </span>
                  ) : (
                    <span className="text-muted">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
