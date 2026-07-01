"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFilters, createSubscription } from "@/lib/api";

export default function AlertsPage() {
  const alertsEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_ALERTS === "true";
  const [email, setEmail] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: filtersData } = useQuery({
    queryKey: ["filters"],
    queryFn: getFilters,
  });

  const filters = filtersData?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setResult(null);

    const res = await createSubscription({
      email,
      speciesFilter: selectedSpecies,
      conditionFilter: selectedConditions,
      stateFilter: selectedStates,
    });

    setSubmitting(false);

    if (res.error) {
      setResult({ success: false, message: res.error });
    } else {
      setResult({
        success: true,
        message: "Subscribed! You'll receive email notifications for matching trials.",
      });
      setEmail("");
      setSelectedSpecies([]);
      setSelectedConditions([]);
      setSelectedStates([]);
    }
  };

  const toggleItem = (
    arr: string[],
    setter: (v: string[]) => void,
    value: string
  ) => {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-2">
        Get Notified of New Trials
      </h1>
      {!alertsEnabled ? (
        <div className="bg-surface rounded-lg border border-gray-200 p-6">
          <p className="text-muted">
            Email alerts are paused while delivery is being configured. For now,
            use the source status page or contact{" "}
            <a
              href="mailto:evan@nisonco.com"
              className="text-primary hover:underline"
            >
              evan@nisonco.com
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted mb-6">
            Receive email notifications when new trials matching your criteria are listed.
            Unsubscribe anytime.
          </p>

          <form onSubmit={handleSubmit} className="bg-surface rounded-lg border border-gray-200 p-6">
        <div className="mb-5">
          <label className="block text-sm font-medium mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          />
        </div>

        {filters && (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">
                Species (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {filters.species.map((s) => (
                  <label
                    key={s.value}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                      selectedSpecies.includes(s.value)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text border-gray-300 hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecies.includes(s.value)}
                      onChange={() =>
                        toggleItem(selectedSpecies, setSelectedSpecies, s.value)
                      }
                      className="sr-only"
                    />
                    <span className="capitalize">{s.value}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-1.5">
                Conditions (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {filters.conditions.slice(0, 10).map((c) => (
                  <label
                    key={c.value}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                      selectedConditions.includes(c.value)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-text border-gray-300 hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(c.value)}
                      onChange={() =>
                        toggleItem(
                          selectedConditions,
                          setSelectedConditions,
                          c.value
                        )
                      }
                      className="sr-only"
                    />
                    <span className="capitalize">
                      {c.value.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {filters.states.length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium mb-1.5">
                  States (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {filters.states.map((s) => (
                    <label
                      key={s.value}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                        selectedStates.includes(s.value)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-text border-gray-300 hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(s.value)}
                        onChange={() =>
                          toggleItem(selectedStates, setSelectedStates, s.value)
                        }
                        className="sr-only"
                      />
                      {s.value}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={submitting || !email}
          className="w-full py-2.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Subscribing..." : "Subscribe"}
        </button>

        {result && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              result.success
                ? "bg-success/10 text-success border border-success/20"
                : "bg-danger/10 text-danger border border-danger/20"
            }`}
          >
            {result.message}
          </div>
        )}
          </form>
        </>
      )}
    </div>
  );
}
