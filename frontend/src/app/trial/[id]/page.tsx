"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getTrial } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { SpeciesList } from "@/components/SpeciesIcon";
import { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  oncology: "Oncology", cardiology: "Cardiology", neurology: "Neurology",
  orthopedic: "Orthopedic", dermatology: "Dermatology",
  gastroenterology: "Gastroenterology", ophthalmology: "Ophthalmology",
  behavioral: "Behavioral", endocrine: "Endocrine",
  infectious_disease: "Infectious Disease", nephrology: "Nephrology",
  urology: "Urology", emergency: "Emergency", nutrition: "Nutrition",
  pain_management: "Pain Management", dentistry: "Dentistry",
  internal_medicine: "Internal Medicine", surgery: "Surgery",
  reproduction: "Reproduction", respiratory: "Respiratory",
  hematology: "Hematology", immunology: "Immunology", other: "Other",
};

const FINANCIAL_LABELS: Record<string, string> = {
  fully_funded: "Fully Funded", partially_funded: "Partially Funded",
  owner_costs: "Owner Costs", unknown: "Unknown",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function TrialDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);
  const [showCriteria, setShowCriteria] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["trial", id],
    queryFn: () => getTrial(id),
    enabled: !isNaN(id),
  });

  const trial = data?.data;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-8" />
        <div className="h-40 bg-gray-200 rounded mb-4" />
      </div>
    );
  }

  if (error || !trial) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <a href="/" className="text-secondary hover:underline text-sm mb-6 inline-block">
          &larr; Back to results
        </a>
        <div className="bg-danger/5 border border-danger/20 rounded-lg p-6 text-center">
          <p className="text-danger font-medium">Trial not found</p>
        </div>
      </div>
    );
  }

  const location = [trial.locationCity, trial.locationState].filter(Boolean).join(", ");
  const category = CATEGORY_LABELS[trial.conditionCategory] || trial.conditionCategory;
  const financial = trial.financialInfo ? FINANCIAL_LABELS[trial.financialInfo] || trial.financialInfo : null;

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <a href="/" className="text-secondary hover:underline text-sm mb-6 inline-block">
        &larr; Back to results
      </a>

      <div className="bg-surface rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="mb-3">
            <StatusBadge status={trial.enrollmentStatus} />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">{trial.title}</h1>
          <p className="text-muted">
            {trial.source.name}
            {location && <> &middot; {location}</>}
          </p>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Species
            </p>
            <SpeciesList species={trial.species} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Condition
            </p>
            <p className="text-sm font-medium">{category}</p>
            {trial.conditionSpecific && (
              <p className="text-sm text-muted capitalize">
                {trial.conditionSpecific}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Funding
            </p>
            <p className="text-sm font-medium">{financial || "Not specified"}</p>
          </div>
        </div>

        {/* Eligibility */}
        {(trial.eligibilitySummary || trial.eligibilityDetails) && (
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
              Eligibility
            </h2>
            {trial.eligibilitySummary && (
              <p className="text-sm leading-relaxed mb-3">
                {trial.eligibilitySummary}
              </p>
            )}
            {trial.eligibilityDetails && (
              <>
                <button
                  onClick={() => setShowCriteria(!showCriteria)}
                  className="text-sm text-secondary hover:underline"
                >
                  {showCriteria ? "Hide" : "Show"} full criteria
                </button>
                {showCriteria && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                    {trial.eligibilityDetails}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Contact */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Contact
          </h2>
          <div className="space-y-2 text-sm">
            {trial.principalInvestigator && (
              <p>
                <span className="text-muted">PI:</span>{" "}
                {trial.principalInvestigator}
              </p>
            )}
            {trial.contactEmail && (
              <p>
                <a
                  href={`mailto:${trial.contactEmail}`}
                  className="text-secondary hover:underline"
                >
                  {trial.contactEmail}
                </a>
              </p>
            )}
            {trial.contactPhone && (
              <p>
                <a
                  href={`tel:${trial.contactPhone}`}
                  className="text-secondary hover:underline"
                >
                  {trial.contactPhone}
                </a>
              </p>
            )}
            {!trial.principalInvestigator && !trial.contactEmail && !trial.contactPhone && (
              <p className="text-muted">
                Contact information not available. Visit the institution website for details.
              </p>
            )}
          </div>
        </div>

        {/* Metadata + Actions */}
        <div className="p-6 bg-gray-50/50">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
            Details
          </h2>
          <div className="space-y-1 text-sm text-muted mb-4">
            <p>First listed: {formatDate(trial.firstSeen)}</p>
            <p>Last verified: {formatDate(trial.lastSeen)}</p>
            {trial.avmaRegistryId && (
              <p>AVMA Registry: {trial.avmaRegistryId}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {trial.source.url && (
              <a
                href={trial.sourceUrl?.startsWith("http") ? trial.sourceUrl : trial.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light transition-colors"
              >
                View on Institution Website
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              {copied ? "Copied!" : "Share This Trial"}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              Print Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
