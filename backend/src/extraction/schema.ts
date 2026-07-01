import { z } from "zod";

export const SPECIES_VALUES = [
  "dog", "cat", "horse", "avian", "exotic",
  "cattle", "swine", "goat", "sheep", "rabbit", "other",
] as const;

export const CONDITION_CATEGORIES = [
  "oncology", "cardiology", "neurology", "orthopedic", "dermatology",
  "gastroenterology", "ophthalmology", "behavioral", "endocrine",
  "infectious_disease", "nephrology", "urology", "emergency",
  "nutrition", "pain_management", "dentistry", "internal_medicine",
  "surgery", "reproduction", "respiratory", "hematology", "immunology", "other",
] as const;

export const ENROLLMENT_STATUSES = [
  "recruiting", "enrolled", "completed", "suspended", "removed", "unknown",
] as const;

export const TrialExtractionSchema = z.object({
  title: z.string().min(1),
  species: z.array(z.enum(SPECIES_VALUES)).default(["dog"]),
  condition_category: z.enum(CONDITION_CATEGORIES).default("other"),
  condition_specific: z.string().nullable().default(null),
  enrollment_status: z.enum(ENROLLMENT_STATUSES).default("unknown"),
  eligibility_summary: z.string().nullable().default(null),
  eligibility_details: z.string().nullable().default(null),
  principal_investigator: z.string().nullable().default(null),
  contact_email: z.string().nullable().default(null),
  contact_phone: z.string().nullable().default(null),
  financial_info: z.string().nullable().default(null),
  source_url_fragment: z.string().nullable().default(null),
});

export type TrialExtraction = z.infer<typeof TrialExtractionSchema>;
