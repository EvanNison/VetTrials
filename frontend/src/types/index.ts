export interface Trial {
  id: number;
  sourceId: number;
  title: string;
  sourceUrl: string | null;
  avmaRegistryId: string | null;
  species: string[];
  conditionCategory: string;
  conditionSpecific: string | null;
  enrollmentStatus: string;
  eligibilitySummary: string | null;
  eligibilityDetails: string | null;
  principalInvestigator: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  financialInfo: string | null;
  locationCity: string | null;
  locationState: string | null;
  firstSeen: string;
  lastSeen: string;
  lastChanged: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  source: {
    id: number;
    name: string;
    shortName: string;
    url?: string;
  };
}

export interface FilterOption {
  value: string;
  count: number;
}

export interface InstitutionOption {
  id: number;
  name: string;
  shortName: string;
  count: number;
}

export interface FilterData {
  species: FilterOption[];
  conditions: FilterOption[];
  statuses: FilterOption[];
  states: FilterOption[];
  institutions: InstitutionOption[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TrialSearchResponse {
  data: {
    trials: Trial[];
    pagination: Pagination;
  } | null;
  error: string | null;
}

export interface SourceStatus {
  id: number;
  name: string;
  shortName: string;
  tier: number;
  trialCount: number;
  lastScraped: string | null;
  lastSuccess: string | null;
  lastError: string | null;
}
