"use client";

import type { FilterData } from "@/types";

interface FilterState {
  species: string[];
  condition: string[];
  status: string[];
  state: string;
  institution: string;
}

interface FilterSidebarProps {
  filters: FilterData;
  selected: FilterState;
  onChange: (filters: FilterState) => void;
}

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

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  labelMap,
}: {
  label: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
  labelMap?: Record<string, string>;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
        {label}
      </h4>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 rounded px-1 py-0.5"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="flex-1 capitalize">
              {labelMap?.[opt.value] || opt.value}
            </span>
            <span className="text-xs text-muted">{opt.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({
  filters,
  selected,
  onChange,
}: FilterSidebarProps) {
  const hasFilters =
    selected.species.length > 0 ||
    selected.condition.length > 0 ||
    selected.status.length > 0 ||
    selected.state !== "" ||
    selected.institution !== "";

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-4 bg-surface rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Filters</h3>
          {hasFilters && (
            <button
              onClick={() =>
                onChange({
                  species: [],
                  condition: [],
                  status: [],
                  state: "",
                  institution: "",
                })
              }
              className="text-xs text-secondary hover:text-secondary/80"
            >
              Clear all
            </button>
          )}
        </div>

        <CheckboxGroup
          label="Species"
          options={filters.species}
          selected={selected.species}
          onChange={(v) => onChange({ ...selected, species: v })}
        />

        <CheckboxGroup
          label="Condition"
          options={filters.conditions}
          selected={selected.condition}
          onChange={(v) => onChange({ ...selected, condition: v })}
          labelMap={CATEGORY_LABELS}
        />

        <CheckboxGroup
          label="Status"
          options={filters.statuses}
          selected={selected.status}
          onChange={(v) => onChange({ ...selected, status: v })}
          labelMap={{
            recruiting: "Recruiting",
            enrolled: "Enrolled",
            completed: "Completed",
            suspended: "Suspended",
            unknown: "Unknown",
          }}
        />

        {filters.states.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              State
            </h4>
            <select
              value={selected.state}
              onChange={(e) =>
                onChange({ ...selected, state: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">All States</option>
              {filters.states.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value} ({s.count})
                </option>
              ))}
            </select>
          </div>
        )}

        {filters.institutions.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Institution
            </h4>
            <select
              value={selected.institution}
              onChange={(e) =>
                onChange({ ...selected, institution: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">All Institutions</option>
              {filters.institutions.map((inst) => (
                <option key={inst.id} value={String(inst.id)}>
                  {inst.shortName} ({inst.count})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </aside>
  );
}
