"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState, Suspense } from "react";
import { searchTrials, getFilters } from "@/lib/api";
import { TrialCard } from "@/components/TrialCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SearchBar } from "@/components/SearchBar";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") || "";
  const species = searchParams.get("species")?.split(",").filter(Boolean) || [];
  const condition = searchParams.get("condition")?.split(",").filter(Boolean) || [];
  const status = searchParams.get("status")?.split(",").filter(Boolean) || [];
  const state = searchParams.get("state") || "";
  const institution = searchParams.get("institution") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [showFilters, setShowFilters] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset page when filters change
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`/?${params.toString()}`);
    },
    [searchParams, router]
  );

  const { data: trialsData, isLoading, error } = useQuery({
    queryKey: ["trials", q, species, condition, status, state, institution, page],
    queryFn: () =>
      searchTrials({
        q: q || undefined,
        species: species.length ? species : undefined,
        condition: condition.length ? condition : undefined,
        status: status.length ? status : undefined,
        state: state || undefined,
        institution: institution || undefined,
        page,
      }),
  });

  const { data: filtersData } = useQuery({
    queryKey: ["filters"],
    queryFn: getFilters,
  });

  const trials = trialsData?.data?.trials || [];
  const pagination = trialsData?.data?.pagination;
  const filterOptions = filtersData?.data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <SearchBar
        query={q}
        onChange={(query) => updateParams({ q: query })}
        totalResults={pagination?.total}
        totalTrials={pagination?.total}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {filterOptions && (
          <>
            <button
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm mb-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
              <FilterSidebar
                filters={filterOptions}
                selected={{ species, condition, status, state, institution }}
                onChange={(f) =>
                  updateParams({
                    species: f.species.join(","),
                    condition: f.condition.join(","),
                    status: f.status.join(","),
                    state: f.state,
                    institution: f.institution,
                  })
                }
              />
            </div>
          </>
        )}

        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface rounded-lg border border-gray-200 p-5 animate-pulse"
                >
                  <div className="h-5 bg-gray-200 rounded w-24 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-danger/5 border border-danger/20 rounded-lg p-6 text-center">
              <p className="text-danger font-medium mb-2">
                Unable to load trials
              </p>
              <p className="text-sm text-muted mb-4">
                Something went wrong. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && trials.length === 0 && (
            <div className="bg-surface rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-lg font-medium text-text mb-2">
                No trials found
              </p>
              <p className="text-sm text-muted">
                {q
                  ? `No trials found for "${q}". Try different keywords.`
                  : "No trials match your current filters. Try broadening your search."}
              </p>
            </div>
          )}

          {!isLoading && !error && trials.length > 0 && (
            <>
              <div className="space-y-3">
                {trials.map((trial) => (
                  <TrialCard key={trial.id} trial={trial} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => updateParams({ page: String(page + 1) })}
                    className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeSearch() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse h-12 bg-gray-200 rounded-lg mb-6" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
