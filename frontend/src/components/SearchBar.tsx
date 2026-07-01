"use client";

import { useState, useEffect, useCallback } from "react";

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  totalResults?: number;
  totalTrials?: number;
}

export function SearchBar({
  query,
  onChange,
  totalResults,
  totalTrials,
}: SearchBarProps) {
  const [local, setLocal] = useState(query);

  useEffect(() => {
    setLocal(query);
  }, [query]);

  const debounceRef = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => onChange(value), 300);
      };
    })(),
    [onChange]
  );

  const handleChange = (value: string) => {
    setLocal(value);
    debounceRef(value);
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={local}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search trials by condition, species, treatment..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        {local && (
          <button
            onClick={() => {
              setLocal("");
              onChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {totalResults !== undefined && totalTrials !== undefined && (
        <p className="text-sm text-muted mt-2">
          Showing {totalResults} of {totalTrials} trials
        </p>
      )}
    </div>
  );
}
