import type { Trial } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { SpeciesList } from "./SpeciesIcon";

const CATEGORY_LABELS: Record<string, string> = {
  oncology: "Oncology",
  cardiology: "Cardiology",
  neurology: "Neurology",
  orthopedic: "Orthopedic",
  dermatology: "Dermatology",
  gastroenterology: "Gastroenterology",
  ophthalmology: "Ophthalmology",
  behavioral: "Behavioral",
  endocrine: "Endocrine",
  infectious_disease: "Infectious Disease",
  nephrology: "Nephrology",
  urology: "Urology",
  emergency: "Emergency",
  nutrition: "Nutrition",
  pain_management: "Pain Management",
  dentistry: "Dentistry",
  internal_medicine: "Internal Medicine",
  surgery: "Surgery",
  reproduction: "Reproduction",
  respiratory: "Respiratory",
  hematology: "Hematology",
  immunology: "Immunology",
  other: "Other",
};

const FINANCIAL_LABELS: Record<string, string> = {
  fully_funded: "Fully Funded",
  partially_funded: "Partially Funded",
  owner_costs: "Owner Costs",
  unknown: "",
};

export function TrialCard({ trial }: { trial: Trial }) {
  const category = CATEGORY_LABELS[trial.conditionCategory] || trial.conditionCategory;
  const financial = trial.financialInfo ? FINANCIAL_LABELS[trial.financialInfo] || "" : "";
  const location = [trial.locationCity, trial.locationState].filter(Boolean).join(", ");

  return (
    <a
      href={`/trial/${trial.id}`}
      className="block bg-surface rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <StatusBadge status={trial.enrollmentStatus} />
        <span className="text-xs text-muted truncate">{trial.source.name}</span>
      </div>

      <h3 className="text-base font-semibold text-text leading-snug mb-3 line-clamp-2">
        {trial.title}
      </h3>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted mb-3">
        <SpeciesList species={trial.species} />
        <span className="text-muted/40">·</span>
        <span>{category}</span>
        {trial.conditionSpecific && (
          <>
            <span className="text-muted/40">·</span>
            <span className="capitalize">{trial.conditionSpecific}</span>
          </>
        )}
        {location && (
          <>
            <span className="text-muted/40">·</span>
            <span>{location}</span>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted mb-3">
        {trial.principalInvestigator && (
          <span>PI: {trial.principalInvestigator}</span>
        )}
        {financial && (
          <>
            {trial.principalInvestigator && <span className="text-muted/40">·</span>}
            <span className="text-success font-medium">{financial}</span>
          </>
        )}
      </div>

      {trial.eligibilitySummary && (
        <p className="text-sm text-muted line-clamp-2">
          {trial.eligibilitySummary}
        </p>
      )}
    </a>
  );
}
